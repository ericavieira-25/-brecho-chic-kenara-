/**
 * productAvailabilityService.js
 *
 * Gerencia a disponibilidade de produtos após compras.
 * Ao criar um pedido, os produtos comprados deixam de estar disponíveis.
 * A indisponibilidade é persistida em localStorage.
 */

const UNAVAILABLE_PRODUCTS_KEY = 'brecho_unavailable_products';

/**
 * Obtém lista de IDs de produtos indisponíveis
 */
export function getUnavailableProductIds() {
  try {
    const stored = localStorage.getItem(UNAVAILABLE_PRODUCTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Erro ao carregar produtos indisponíveis:', error);
    return [];
  }
}

/**
 * Salva lista de IDs indisponíveis
 */
function saveUnavailableProductIds(ids) {
  try {
    localStorage.setItem(UNAVAILABLE_PRODUCTS_KEY, JSON.stringify(ids));
  } catch (error) {
    console.error('Erro ao salvar produtos indisponíveis:', error);
    throw error;
  }
}

/**
 * Marca um produto como indisponível
 */
export function markProductUnavailable(productId) {
  const unavailable = getUnavailableProductIds();
  if (!unavailable.includes(productId)) {
    unavailable.push(productId);
    saveUnavailableProductIds(unavailable);
  }
}

/**
 * Marca múltiplos produtos como indisponíveis
 */
export function markProductsUnavailable(productIds) {
  const unavailable = getUnavailableProductIds();
  const updated = new Set([...unavailable, ...productIds]);
  saveUnavailableProductIds(Array.from(updated));
}

/**
 * Remove um produto da lista de indisponíveis (para reativar)
 */
export function markProductAvailable(productId) {
  const unavailable = getUnavailableProductIds();
  const filtered = unavailable.filter((id) => id !== productId);
  saveUnavailableProductIds(filtered);
}

/**
 * Verifica se um produto está indisponível
 */
export function isProductUnavailable(productId) {
  const unavailable = getUnavailableProductIds();
  return unavailable.includes(productId);
}

/**
 * Obtém status de disponibilidade de um produto
 * Retorna true se disponível, false se indisponível
 */
export function isProductAvailable(productId) {
  return !isProductUnavailable(productId);
}

/**
 * Filtra lista de produtos removendo indisponíveis
 */
export function filterAvailableProducts(products) {
  const unavailable = getUnavailableProductIds();
  return products.filter((p) => !unavailable.includes(p.id));
}

/**
 * Enriquece lista de produtos com status de disponibilidade local
 */
export function enrichProductsWithAvailability(products) {
  return products.map((product) => ({
    ...product,
    available: !isProductUnavailable(product.id),
  }));
}

/**
 * Limpa todos os produtos indisponíveis (reset)
 */
export function clearUnavailableProducts() {
  try {
    localStorage.removeItem(UNAVAILABLE_PRODUCTS_KEY);
  } catch (error) {
    console.error('Erro ao limpar produtos indisponíveis:', error);
  }
}

/**
 * Retorna estatísticas de disponibilidade
 */
export function getAvailabilityStats(totalProducts) {
  const unavailable = getUnavailableProductIds();
  return {
    total: totalProducts,
    available: totalProducts - unavailable.length,
    unavailable: unavailable.length,
  };
}
