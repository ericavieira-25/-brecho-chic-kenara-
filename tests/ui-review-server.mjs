// Disposable UI environment. All database work is rolled back on shutdown.
import crypto from 'node:crypto';
import express from '../server/node_modules/express/index.js';
import dotenv from '../server/node_modules/dotenv/lib/main.js';
import { getPool, ensureProductsTable, ensureOrdersTable } from '../api/_db.js';
import users from '../api/users.js';
import products from '../api/products.js';
import orders from '../api/orders.js';
dotenv.config({path:['server/.env','.env.local'],quiet:true});
process.env.AUTH_SECRET=crypto.randomBytes(32).toString('hex');
delete process.env.ENABLE_DEMO_USERS;
delete process.env.ENABLE_DEMO_PRODUCTS;
const pool=getPool();
const client=await pool.connect();
const query=client.query.bind(client);
const schema=`kenara_ui_${crypto.randomBytes(8).toString('hex')}`;
await query('BEGIN');
await query(`CREATE SCHEMA ${schema}`);
await query(`SET LOCAL search_path TO ${schema}`);
pool.query=query;
pool.connect=async()=>({query(sql,args){return query(sql==='BEGIN'?'SAVEPOINT operation':sql==='COMMIT'?'RELEASE SAVEPOINT operation':sql==='ROLLBACK'?'ROLLBACK TO SAVEPOINT operation':sql,args);},release(){}});
const password='Review-only-2026!';
for(const [name,email,role] of [['Cliente revisão','cliente@example.test','cliente'],['Admin revisão','admin@example.test','administradora'],['Ana Carol','fornecedora@example.test','fornecedora']]) {
  const res={status(){return this;},json(body){this.body=body;return this;},setHeader(){}};
  await users({method:'POST',body:{action:'register',name,email,password},headers:{}},res);
  if(!res.body.user) throw new Error('Não foi possível criar usuário de teste.');
  await query('UPDATE users SET role=$1,supplier_id=$2 WHERE email=$3',[role,role==='fornecedora'?'supplier-ana-carol':null,email]);
}
await ensureProductsTable();
await ensureOrdersTable();
for(const [id,name,category,size,price] of [[1,'Blusa revisão','blusas','M',50],[2,'Vestido revisão','vestidos','P',160],[3,'Calça revisão','calcas','38',80],[4,'Casaco revisão','casacos','G',100]]) {
  await query("INSERT INTO products(id,name,category,category_name,size,condition,condition_label,price,photo,supplier_id,supplier_name,status) VALUES($1,$2,$3,$3,$4,'otimo','Ótimo',$5,'/placeholder-product.svg','supplier-ana-carol','Ana Carol','disponivel')",[id,name,category,size,price]);
}
const customer=(await query("SELECT id FROM users WHERE email='cliente@example.test'")).rows[0];
for (const [id,productId,name,price,status,paymentStatus] of [['ORDER-review-confirm',3,'Calça revisão',80,'aguardando_pagamento','processing'],['ORDER-review-cancel',2,'Vestido revisão',160,'aguardando_pagamento','pending'],['ORDER-review-paid',4,'Casaco revisão',100,'processando','paid']]) {
  await query('INSERT INTO orders(id,customer_id,customer_name,customer_email,date,status,payment_status,subtotal,shipping,total,items) VALUES($1,$2,$3,$4,CURRENT_DATE,$5,$6,$7,0,$7,$8::jsonb)',[id,customer.id,'Cliente revisão','cliente@example.test',status,paymentStatus,price,JSON.stringify([{productId,name,price,quantity:1,supplierId:'supplier-ana-carol',supplierName:'Ana Carol'}])]);
  await query('UPDATE products SET status=$1 WHERE id=$2',[paymentStatus==='paid'?'vendido':'reservado',productId]);
}
const app=express();app.use(express.json({limit:'5mb'}));
let queue=Promise.resolve();
for(const [name,handler] of Object.entries({users,auth:users,products,orders})) app.all(`/api/${name}`,(req,res)=>{
  queue=queue.then(async()=>{await query('SAVEPOINT request');try{await handler(req,res);await query('RELEASE SAVEPOINT request');}catch(error){await query('ROLLBACK TO SAVEPOINT request');if(!res.headersSent)res.status(500).json({erro:error.message});}});
});
const server=app.listen(3100,'127.0.0.1',()=>console.log('Revisão isolada em http://127.0.0.1:3100. Contas @example.test; senha Review-only-2026!'));
let stopping=false;
async function stop(){if(stopping)return;stopping=true;server.close();await queue;await query('ROLLBACK');client.release();await pool.end();console.log('Dados de revisão revertidos.');process.exit();}
process.on('SIGINT',stop);process.on('SIGTERM',stop);
