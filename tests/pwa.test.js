import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function worker(fetch, cached) {
  const handlers = {};
  vm.runInNewContext(fs.readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8'), {
    URL, Response, fetch,
    caches: { match: async () => cached },
    self: { location: {origin:'https://shop.test'}, addEventListener: (name, handler) => { handlers[name] = handler; } }
  });
  return handlers.fetch;
}
test('offline worker never intercepts API requests or checkout mutations', () => {
  const handle = worker(() => { throw Error('Must not fetch'); });
  for (const request of [
    {url:'https://shop.test/api/orders',method:'POST',mode:'cors'},
    {url:'https://shop.test/api/users',method:'GET',mode:'navigate'},
    {url:'https://shop.test/api/products',method:'GET',mode:'cors'},
    {url:'https://other.test/',method:'GET',mode:'navigate'}
  ]) handle({request,respondWith:()=>assert.fail('Sensitive request intercepted')});
});
test('offline navigation returns only the generic notice', async () => {
  const cached = new Response('Aviso offline');
  const handle = worker(async () => { throw Error('offline'); }, cached);
  let response;
  handle({request:{url:'https://shop.test/pedidos',method:'GET',mode:'navigate'},respondWith:p=>{response=p;}});
  assert.equal(await (await response).text(),'Aviso offline');
});
test('online navigation uses fresh network content', async () => {
  const handle = worker(async () => new Response('Atualizado'), new Response('Offline'));
  let response;
  handle({request:{url:'https://shop.test/catalogo',method:'GET',mode:'navigate'},respondWith:p=>{response=p;}});
  assert.equal(await (await response).text(),'Atualizado');
});
test('install manifest references correctly sized PNG icons', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('../public/manifest.webmanifest', import.meta.url),'utf8'));
  assert.equal(manifest.display,'standalone');
  for (const icon of manifest.icons) {
    const bytes=fs.readFileSync(new URL('../public'+icon.src,import.meta.url));
    const [width,height]=icon.sizes.split('x').map(Number);
    assert.equal(bytes.readUInt32BE(16),width);
    assert.equal(bytes.readUInt32BE(20),height);
  }
});
