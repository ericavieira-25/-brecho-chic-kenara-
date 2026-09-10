// Real PostgreSQL checks in an isolated schema inside a rolled-back transaction.
// No existing products, users, orders or schema objects are changed.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import dotenv from '../server/node_modules/dotenv/lib/main.js';
import { getPool } from '../api/_db.js';
import users from '../api/users.js';
import products from '../api/products.js';
import orders from '../api/orders.js';
import { createSession } from '../api/_session.js';
dotenv.config({ path: ['server/.env', '.env.local'], quiet: true });
process.env.AUTH_SECRET = crypto.randomBytes(32).toString('hex');
delete process.env.ENABLE_DEMO_USERS;
delete process.env.ENABLE_DEMO_PRODUCTS;
const pool = getPool();
const client = await pool.connect();
const query = client.query.bind(client);
const schema = `kenara_test_${crypto.randomBytes(8).toString('hex')}`;
const admin = { id: 'test-admin', email: 'admin@example.test', role: 'administradora' };
const response = () => ({ code:200, headers:{}, status(code){ this.code=code; return this; }, json(body){ this.body=body; return this; }, end(){return this;}, setHeader(key,value){this.headers[key]=value;} });
async function call(handler, method, body, cookie='', queryParams={}) {
  const res=response();
  await handler({method,body,query:queryParams,headers:{cookie,'x-csrf-token':'test'}},res);
  return res;
}
try {
  await query('BEGIN');
  await query(`CREATE SCHEMA ${schema}`);
  await query(`SET LOCAL search_path TO ${schema}`);
  pool.query = query;
  pool.connect = async () => ({
    query(sql,args) {
      if(sql === 'BEGIN') return query('SAVEPOINT api_operation');
      if(sql === 'COMMIT') return query('RELEASE SAVEPOINT api_operation');
      if(sql === 'ROLLBACK') return query('ROLLBACK TO SAVEPOINT api_operation');
      return query(sql,args);
    }, release() {},
  });
  const password = crypto.randomBytes(24).toString('hex');
  const registration=await call(users,'POST',{action:'register',name:'Teste isolado',email:'customer@example.test',password});
  assert.equal(registration.code,201,JSON.stringify(registration.body));
  const customer=registration.body.user;
  const cookie=`kenara_user_session=${createSession(customer)}`;
  const adminCookie=`kenara_user_session=${createSession(admin)}; kenara_csrf=test`;
  const login=await call(users,'POST',{action:'login',email:customer.email,password});
  assert.equal(login.code,200);
  assert.equal((await call(users,'GET',{},cookie)).body.user.id,customer.id);
  assert.equal((await call(users,'POST',{action:'login',email:customer.email,password,admin:true})).code,403);
  const product=await call(products,'POST',{name:'Peça de teste isolada',price:50,supplierId:'supplier-test'},adminCookie);
  assert.equal(product.code,201,JSON.stringify(product.body));
  const productId=product.body.produto.id;
  const edits={name:'Peça editada',price:50,supplierId:'supplier-test',status:'disponivel',tags:['vintage','verão']};
  assert.equal((await call(products,'PATCH',edits,cookie,{id:productId})).code,401);
  const edited=await call(products,'PATCH',edits,adminCookie,{id:productId});
  assert.equal(edited.code,200,JSON.stringify(edited.body));
  assert.equal(edited.body.produto.name,edits.name);
  assert.deepEqual(edited.body.produto.tags,edits.tags);
  const body={id:'ORDER-isolated',customerId:customer.id,customerName:customer.name,total:0,items:[{productId,quantity:1,price:0}]};
  const checkout=await call(orders,'POST',body,cookie);
  assert.equal(checkout.code,201,JSON.stringify(checkout.body));
  assert.equal(checkout.body.order.total,65.9);
  assert.equal((await call(products,'PATCH',edits,adminCookie,{id:productId})).code,409);
  assert.equal((await call(orders,'POST',{...body,id:'ORDER-second'},cookie)).code,409);
  assert.equal((await call(orders,'PATCH',{paymentStatus:'paid'},cookie,{id:body.id})).code,403);
  assert.equal((await call(orders,'PATCH',{paymentStatus:'processing',paymentMethod:'pix'},cookie,{id:body.id})).code,200);
  const paid=await call(orders,'PATCH',{paymentStatus:'paid'},adminCookie,{id:body.id});
  assert.equal(paid.code,200,JSON.stringify(paid.body));
  assert.equal(paid.body.order.status,'processando');
  const stock=await query('SELECT status FROM products WHERE id=$1',[productId]);
  assert.equal(stock.rows[0].status,'vendido');
  assert.equal((await call(products,'PATCH',edits,adminCookie,{id:productId})).code,409);
  const disposable=await call(products,'POST',{name:'Outra peça',price:10,supplierId:'supplier-test'},adminCookie);
  assert.equal(disposable.code,201);
  assert.equal((await call(products,'DELETE',{},adminCookie,{id:disposable.body.produto.id})).code,204);
  console.log('Integração PostgreSQL OK: cadastro, login, sessão, restrição administrativa, produto, checkout, reserva, PIX, confirmação e exclusão.');
} finally {
  await query('ROLLBACK');
  client.release();
  await pool.end();
  console.log('Transação revertida; dados de teste não persistidos.');
}
