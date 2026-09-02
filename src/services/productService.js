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

export async function addProduct(product) {
  try {
    const response = await fetch('http://localhost:3000/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: product.name,
        category: product.category,
        categoryName: product.categoryName,
        size: product.size,
        condition: product.condition,
        conditionLabel: product.conditionLabel,
        price: product.price,
        originalPrice: product.originalPrice,
        brand: product.brand,
        description: product.description,
        photo: product.photo,
        supplierId: product.supplierId,
        supplierName: product.supplierName,
        createdBy: product.createdBy,
        status: product.status || 'disponivel',
      }),
    });

    if (!response.ok) {
      throw new Error('Erro ao cadastrar produto na API.');
    }

    const data = await response.json();

    return data.produto;
  } catch (error) {
    console.error('Erro ao cadastrar produto:', error);
    throw error;
  }
}
export function deleteProduct(productId) {
  const products = getProducts();

  const updatedProducts = products.filter(
    (product) => product.id !== productId
  );

  saveProducts(updatedProducts);

  return updatedProducts;
}