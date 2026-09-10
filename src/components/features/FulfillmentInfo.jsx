export default function FulfillmentInfo({ order }) {
  if (!order?.fulfillmentMethod) return null;
  return <div style={{margin:'1rem 0',lineHeight:1.5}}>
    <strong>{order.fulfillmentMethod === 'local_delivery' ? 'Entrega local pela Kenara' : 'Retirar na loja'}</strong>
    {order.fulfillmentMethod === 'local_delivery' ? <>
      <p>{order.deliveryAddress}</p>
      <p>Entrega e eventual taxa a combinar com a Kenara. O PIX cobre somente as peças.</p>
    </> : <p>Retirada grátis. Combine o horário com a Kenara.</p>}
  </div>;
}
