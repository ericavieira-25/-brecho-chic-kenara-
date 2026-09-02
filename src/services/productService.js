const PRODUCTS_KEY = 'brecho_products';

export function getProducts() {
  try {
    const stored = localStorage.getItem(PRODUCTS_KEY);

    if (!stored) {
      return [];
    }

    const products = JSON.parse(stored);

    return Array.isArray(products) ? products : [];
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
    return [];
  }
}

export function saveProducts(products) {
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    return true;
  } catch (error) {
    console.error('Erro ao salvar produtos:', error);
    return false;
  }
}

export function addProduct(product) {
  const products = getProducts();

  const newProduct = {
    ...product,
    id: `product-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'disponivel',
  };

  products.push(newProduct);

  saveProducts(products);

  return newProduct;
}

export function deleteProduct(productId) {
  const products = getProducts();

  const updatedProducts = products.filter(
    (product) => product.id !== productId
  );

  saveProducts(updatedProducts);

  return updatedProducts;
}