/**
 * productService.js
 *
 * Camada central para acesso e regras de dados do catálogo.
 * Mantém compatibilidade com o código atual, mas prepara a arquitetura
 * para migração futura para backend real.
 */

import { products } from './products.js';
import { getSupplierById, getSupplierByName } from './suppliers.js';
import { isProductAvailable } from './productAvailabilityService.js';

function enrichProduct(product) {
  if (!product) return product;

  const supplier = getSupplierById(product.supplierId) || getSupplierByName(product.seller);
  // Enriquecer com status de disponibilidade local (localStorage)
  const available = product.available !== false && isProductAvailable(product.id);
  
  return {
    ...product,
    available,
    supplierId: product.supplierId || supplier?.id || null,
    supplierName: supplier?.name || product.seller || 'Fornecedora',
  };
}

// ─── Leitura básica ─────────────────────────────────────────────────────────
export function getAllProducts() {
  return products.map(enrichProduct);
}

export function getAvailableProducts() {
  return getAllProducts().filter((p) => p.available !== false);
}

export function getProductById(id) {
  return getAllProducts().find((p) => p.id === Number(id));
}

// ─── Listagens temáticas ────────────────────────────────────────────────────
export function getNewestProducts(limit = 8) {
  return getAvailableProducts()
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

export function getFeaturedProducts(limit = 4) {
  return getAvailableProducts()
    .slice()
    .sort((a, b) => {
      const discA = a.originalPrice > a.price ? ((a.originalPrice - a.price) / a.originalPrice) : 0;
      const discB = b.originalPrice > b.price ? ((b.originalPrice - b.price) / b.originalPrice) : 0;
      return discB - discA;
    })
    .slice(0, limit);
}

export function getRelatedByCategory(product, limit = 4) {
  if (!product) return [];

  return getAvailableProducts()
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, limit);
}

export function getRelatedBySupplier(product, limit = 4) {
  if (!product) return [];

  const supplierId = product.supplierId || getSupplierByName(product.seller)?.id;

  return getAvailableProducts()
    .filter((p) => {
      const productSupplierId = p.supplierId || getSupplierByName(p.seller)?.id;
      return productSupplierId && supplierId && productSupplierId === supplierId && p.id !== product.id;
    })
    .slice(0, limit);
}

// ─── Busca e filtragem ───────────────────────────────────────────────────────
export function filterProducts(query = '', filters = {}, sort = 'relevancia') {
  const onlyAvailable = filters.onlyAvailable !== false;
  let list = onlyAvailable ? getAvailableProducts() : getAllProducts();

  if (query.trim()) {
  const normalize = (text) =>
    String(text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const words = normalize(query.trim())
    .split(/\s+/)
    .filter(Boolean);

  list = list.filter((p) => {
    const searchableText = normalize(p.name);

    return words.every((word) =>
      searchableText.includes(word)
    );
  });
}

  if (filters.categories?.length) {
    list = list.filter((p) => filters.categories.includes(p.category));
  }

  if (filters.sizes?.length) {
    list = list.filter((p) => filters.sizes.includes(p.size));
  }

  if (filters.conditions?.length) {
    list = list.filter((p) => filters.conditions.includes(p.condition));
  }

  if (filters.minPrice !== '' && filters.minPrice !== undefined) {
    list = list.filter((p) => p.price >= Number(filters.minPrice));
  }

  if (filters.maxPrice !== '' && filters.maxPrice !== undefined) {
    list = list.filter((p) => p.price <= Number(filters.maxPrice));
  }

  const sorted = [...list];
  switch (sort) {
    case 'menor-preco':
      sorted.sort((a, b) => a.price - b.price);
      break;
    case 'maior-preco':
      sorted.sort((a, b) => b.price - a.price);
      break;
    case 'mais-recentes':
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;
    default:
      break;
  }

  return sorted;
}

export function quickSearch(query, limit = 6) {
  if (!query || query.trim().length < 2) return [];
  return filterProducts(query, {}, 'relevancia').slice(0, limit);
}

// ─── Metadados ───────────────────────────────────────────────────────────────
export function getSellers() {
  return [...new Set(getAllProducts().map((p) => p.supplierName || p.seller))].sort();
}

export function getPriceRange() {
  const prices = getAllProducts().map((p) => p.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}
