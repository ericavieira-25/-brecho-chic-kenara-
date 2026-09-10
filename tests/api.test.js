import test from 'node:test';
import assert from 'node:assert/strict';
import { getPool } from '../api/_db.js';
import { createSession, readSession, setSessionCookies } from '../api/_session.js';
import orders from '../api/orders.js';
import products from '../api/products.js';
import { calculateItemFinancialSplit } from '../src/data/financial.js';
import { deleteProduct } from '../src/data/productService.js';
import { createOrder } from '../src/data/orderService.js';

process.env.AUTH_SECRET = 'isolated-test-secret';
process.env.DATABASE_URL = 'postgres://test:test@localhost/test';
delete process.env.ENABLE_DEMO_PRODUCTS;
const db = getPool();
const customer = { id: 'customer', email: 'test@example.test', role: 'cliente' };
const admin = { id: 'admin', email: 'admin@example.test', role: 'administradora' };
const row = { id:'ORDER-test', customer_id:customer.id, date:'2026-09-08', status:'aguardando_pagamento', payment_status:'pending', subtotal:50, shipping:15.9, total:65.9, items:[{productId:1,quantity:1,price:50}] };
function request(method, user = customer, body = {}, query = {}) {
  return { method, body, query, headers: { cookie: `kenara_user_session=${createSession(user)}; kenara_csrf=test`, 'x-csrf-token':'test' } };
}
function response() {
  return { code:200, headers:{}, status(code) { this.code=code; return this; }, json(body) { this.body=body; return this; }, end() { return this; }, setHeader(key,value) { this.headers[key]=value; } };
}
function mockDb(fn) {
  const calls=[];
  const query=async(sql,args=[])=> { calls.push({sql,args}); return fn(sql,args) || {rows:[],rowCount:0}; };
  db.query=query;
  db.connect=async()=>({query,release(){}});
  return calls;
}
test('session rejects forged and malformed signatures', () => {
  const token=createSession(customer);
  assert.equal(readSession({headers:{cookie:`kenara_user_session=${token}`}}).id,customer.id);
  assert.equal(readSession({headers:{cookie:`kenara_user_session=${token.split('.')[0]}.${'é'.repeat(43)}`}}),null);
  assert.equal(readSession({headers:{cookie:`kenara_user_session=${token.slice(0,-4)}fake`}}),null);
});
test('customer login clears previous admin cookies', () => {
  const res=response(); setSessionCookies(res,customer);
  assert.ok(res.headers['Set-Cookie'].some(cookie=>cookie.startsWith('kenara_admin_session=;') && cookie.includes('Max-Age=0')));
});
test('no session cannot read orders', async()=> {
  const res=response(); await orders({method:'GET',headers:{}},res); assert.equal(res.code,401);
});
test('customer cannot confirm payment', async()=> {
  const calls=mockDb(sql=>sql.startsWith('SELECT * FROM orders') ? {rows:[row]} : undefined);
  const res=response(); await orders(request('PATCH',customer,{paymentStatus:'paid'},{id:row.id}),res);
  assert.equal(res.code,403); assert.ok(!calls.some(call=>call.sql.startsWith('UPDATE')));
});
test('supplier cannot change customer orders', async()=> {
  mockDb(sql=>sql.startsWith('SELECT * FROM orders') ? {rows:[row]} : undefined);
  const res=response(); await orders(request('PATCH',{id:'supplier',role:'fornecedora'},{paymentStatus:'paid'},{id:row.id}),res); assert.equal(res.code,404);
});
test('duplicate order id cannot overwrite another customer',async()=> {
  const calls=mockDb(sql=>sql.startsWith('SELECT * FROM orders') ? {rows:[{...row,customer_id:'someone-else'}]} : undefined);
  const res=response(); await orders(request('POST',customer,{id:row.id,customerId:customer.id,items:[{productId:1,quantity:1}]}),res);
  assert.equal(res.code,409); assert.ok(!calls.some(call=>call.sql.startsWith('INSERT INTO orders')));
});
test('checkout takes prices from catalog and reserves stock in transaction',async()=> {
  const calls=mockDb((sql,args)=> {
    if(sql.startsWith('SELECT * FROM products')) return {rows:[{id:1,name:'Peça',price:'50.00',status:'disponivel'}]};
    if(sql.startsWith('INSERT INTO orders')) return {rows:[{...row,subtotal:args[4],shipping:args[5],total:args[6],items:JSON.parse(args[7])}]};
  });
  const res=response(); await orders(request('POST',customer,{id:row.id,customerId:customer.id,total:0,items:[{productId:1,quantity:1,price:0}]}),res);
  assert.equal(res.code,201); assert.equal(res.body.order.total,65.9);
  assert.ok(calls.some(call=>call.sql.includes('FOR UPDATE')));
  assert.ok(calls.some(call=>call.sql.includes("status = 'reservado'")));
  assert.equal(calls.at(-1).sql,'COMMIT');
});
test('unavailable stock rejects checkout',async()=> {
  mockDb(sql=>sql.startsWith('SELECT * FROM products') ? {rows:[{id:1,status:'reservado'}]} : undefined);
  const res=response(); await orders(request('POST',customer,{id:row.id,customerId:customer.id,items:[{productId:1,quantity:1}]}),res); assert.equal(res.code,409);
});
test('unique pieces reject multiple units',async()=> {
  mockDb(()=>undefined); const res=response();
  await orders(request('POST',customer,{id:row.id,customerId:customer.id,items:[{productId:1,quantity:2}]}),res); assert.equal(res.code,400);
});
test('admin confirms payment and marks stock sold',async()=> {
  const calls=mockDb(sql=>sql.startsWith('SELECT * FROM orders') ? {rows:[row]} : sql.startsWith('UPDATE orders') ? {rows:[{...row,status:'processando',payment_status:'paid'}]} : undefined);
  const res=response(); await orders(request('PATCH',admin,{paymentStatus:'paid'},{id:row.id}),res);
  assert.equal(res.code,200); assert.equal(res.body.order.paymentStatus,'paid'); assert.ok(calls.some(call=>call.sql.includes("status='vendido'")));
});
test('cancellation releases reserved stock',async()=> {
  const calls=mockDb(sql=>sql.startsWith('SELECT * FROM orders') ? {rows:[row]} : sql.startsWith('UPDATE orders') ? {rows:[{...row,status:'cancelado',payment_status:'canceled'}]} : undefined);
  const res=response(); await orders(request('PATCH',customer,{status:'cancelado',paymentStatus:'canceled'},{id:row.id}),res);
  assert.equal(res.code,200); assert.ok(calls.some(call=>call.sql.includes("status='disponivel'")));
});
test('product deletion returns empty success',async()=> {
  mockDb(sql=>sql.includes('DELETE FROM products') ? {rows:[{id:1}],rowCount:1} : undefined);
  const res=response(); await products(request('DELETE',admin,{}, {id:'1'}),res); assert.equal(res.code,204);
});
test('financial split preserves exact cents',()=> {
  for(const amount of [0.01,0.02,0.03,10.01,19.99,99.90]) assert.equal(calculateItemFinancialSplit(amount).total,amount);
});
test('frontend accepts successful empty deletion response',async()=> {
  const original=globalThis.fetch;
  globalThis.document={cookie:'kenara_csrf=test'};
  globalThis.fetch=async()=>new Response(null,{status:204});
  try { await assert.doesNotReject(deleteProduct(1)); }
  finally { globalThis.fetch=original; delete globalThis.document; }
});
test('checkout propagates API failure and does not invent a local order',async()=> {
  const original=globalThis.fetch;
  globalThis.document={cookie:''};
  globalThis.fetch=async()=>new Response(JSON.stringify({erro:'Banco indisponível'}),{status:503});
  try {
    await assert.rejects(createOrder({user:customer,cartItems:[{id:1000001,name:'Nova peça',price:50,quantity:1}],subtotal:50,shipping:15.9,total:65.9}),/Banco indisponível/);
  } finally { globalThis.fetch=original; delete globalThis.document; }
});
