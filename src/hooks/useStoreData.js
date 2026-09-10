import { useEffect, useState } from 'react';
import { getAllProducts } from '../data/productService.js';
import { normalizeOrder } from '../data/orderService.js';

export function useStoreData() {
  const [data, setData] = useState({ orders: [], products: [], error: '' });
  useEffect(() => {
    let active = true;
    Promise.all([
      getAllProducts(),
      fetch('/api/orders', { credentials: 'include' }).then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.erro || 'Não foi possível carregar os pedidos.');
        return body.orders.map(normalizeOrder).filter(order => order.paymentStatus === 'paid');
      }),
    ]).then(([products, orders]) => { if (active) setData({ products, orders, error: '' }); })
      .catch(error => { if (active) setData({ products: [], orders: [], error: error.message }); });
    return () => { active = false; };
  }, []);
  return data;
}
