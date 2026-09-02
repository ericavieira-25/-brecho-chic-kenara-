/**
 * productService.js
 *
 * Camada central para acesso e regras de dados do catálogo.
 * Os produtos são carregados da API / PostgreSQL.
 */

import { getSupplierById, getSupplierByName } from './suppliers.js';
import { isProductAvailable } from './productAvailabilityService.js';

const API_URL = 'http://localhost:3000/api/products';

/**
 * Converte o formato vindo do PostgreSQL
 * para o formato usado pelo frontend.
 */
function normalizeProduct(product) {
  if (!product) return product;

  return {
    ...product,

    // PostgreSQL -> frontend
    createdAt: product.createdAt || product.created_at || null,

    categoryName:
      product.categoryName ||
      product.category_name ||
      null,

    originalPrice:
      product.originalPrice ??
      product.original_price ??
      null,

    conditionLabel:
      product.conditionLabel ||
      product.condition_label ||
      null,

    supplierId:
      product.supplierId ||
      product.supplier_id ||
      null,

    supplierName:
      product.supplierName ||
      product.supplier_name ||
      null,

    createdBy:
      product.createdBy ||
      product.created_by ||
      null,

    // Mantém photo/image compatíveis
    photo: product.photo || null,
    image: product.image || null,
  };
}

/**
 * Enriquece produto com informações de fornecedor
 * e disponibilidade.
 */
function enrichProduct(rawProduct) {
  if (!rawProduct) return rawProduct;

  const product = normalizeProduct(rawProduct);

  const supplier =
    getSupplierById(product.supplierId) ||
    getSupplierByName(product.seller);

  let available;

  /*
   * Produtos vindos do banco usam o campo status.
   * Produtos antigos continuam usando o localStorage.
   */
  if (product.status) {
    available = product.status === 'disponivel';
  } else {
    available =
      product.available !== false &&
      isProductAvailable(product.id);
  }

  return {
    ...product,

    available,

    supplierId:
      product.supplierId ||
      supplier?.id ||
      null,

    supplierName:
      product.supplierName ||
      supplier?.name ||
      product.seller ||
      'Fornecedora',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LEITURA BÁSICA
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllProducts() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error('Erro ao buscar produtos da API.');
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error('A API não retornou uma lista de produtos.');
    }

    return data.map(enrichProduct);
  } catch (error) {
    console.error(
      'Erro ao carregar produtos do banco:',
      error
    );

    return [];
  }
}

export async function getAvailableProducts() {
  const products = await getAllProducts();

  return products.filter(
    (product) => product.available !== false
  );
}

export async function getProductById(id) {
  const products = await getAllProducts();

  return products.find(
    (product) => product.id === Number(id)
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LISTAGENS TEMÁTICAS
// ─────────────────────────────────────────────────────────────────────────────

export async function getNewestProducts(limit = 8) {
  const products = await getAvailableProducts();

  return products
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0) -
        new Date(a.createdAt || 0)
    )
    .slice(0, limit);
}

export async function getFeaturedProducts(limit = 4) {
  const products = await getAvailableProducts();

  return products
    .slice()
    .sort((a, b) => {
      const priceA = Number(a.price) || 0;
      const priceB = Number(b.price) || 0;

      const originalA =
        Number(a.originalPrice) || 0;

      const originalB =
        Number(b.originalPrice) || 0;

      const discA =
        originalA > priceA
          ? (originalA - priceA) / originalA
          : 0;

      const discB =
        originalB > priceB
          ? (originalB - priceB) / originalB
          : 0;

      return discB - discA;
    })
    .slice(0, limit);
}

export async function getRelatedByCategory(
  product,
  limit = 4
) {
  if (!product) return [];

  const products = await getAvailableProducts();

  return products
    .filter(
      (item) =>
        item.category === product.category &&
        item.id !== product.id
    )
    .slice(0, limit);
}

export async function getRelatedBySupplier(
  product,
  limit = 4
) {
  if (!product) return [];

  const products = await getAvailableProducts();

  const supplierId =
    product.supplierId ||
    getSupplierByName(product.seller)?.id;

  return products
    .filter((item) => {
      const itemSupplierId =
        item.supplierId ||
        getSupplierByName(item.seller)?.id;

      return (
        itemSupplierId &&
        supplierId &&
        itemSupplierId === supplierId &&
        item.id !== product.id
      );
    })
    .slice(0, limit);
}

// ─────────────────────────────────────────────────────────────────────────────
// BUSCA E FILTRAGEM
// ─────────────────────────────────────────────────────────────────────────────

export async function filterProducts(
  query = '',
  filters = {},
  sort = 'relevancia'
) {
  const onlyAvailable =
    filters.onlyAvailable !== false;

  let list = onlyAvailable
    ? await getAvailableProducts()
    : await getAllProducts();

  const normalize = (text) =>
    String(text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  // Busca
  if (query.trim()) {
    const words = normalize(query.trim())
      .split(/\s+/)
      .filter(Boolean);

    list = list.filter((product) => {
      const searchableText = normalize(
        [
          product.name,
          product.brand,
          product.description,
          product.category,
          product.categoryName,
          product.supplierName,
        ]
          .filter(Boolean)
          .join(' ')
      );

      return words.every((word) =>
        searchableText.includes(word)
      );
    });
  }

  // Categorias
  if (filters.categories?.length) {
    list = list.filter((product) =>
      filters.categories.includes(
        product.category
      )
    );
  }

  // Tamanhos
  if (filters.sizes?.length) {
    list = list.filter((product) =>
      filters.sizes.includes(product.size)
    );
  }

  // Conservação
  if (filters.conditions?.length) {
    list = list.filter((product) =>
      filters.conditions.includes(
        product.condition
      )
    );
  }

  // Preço mínimo
  if (
    filters.minPrice !== '' &&
    filters.minPrice !== undefined
  ) {
    list = list.filter(
      (product) =>
        Number(product.price) >=
        Number(filters.minPrice)
    );
  }

  // Preço máximo
  if (
    filters.maxPrice !== '' &&
    filters.maxPrice !== undefined
  ) {
    list = list.filter(
      (product) =>
        Number(product.price) <=
        Number(filters.maxPrice)
    );
  }

  const sorted = [...list];

  switch (sort) {
    case 'menor-preco':
      sorted.sort(
        (a, b) =>
          Number(a.price) -
          Number(b.price)
      );
      break;

    case 'maior-preco':
      sorted.sort(
        (a, b) =>
          Number(b.price) -
          Number(a.price)
      );
      break;

    case 'mais-recentes':
      sorted.sort(
        (a, b) =>
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
      );
      break;

    default:
      break;
  }

  return sorted;
}

export async function quickSearch(
  query,
  limit = 6
) {
  if (
    !query ||
    query.trim().length < 2
  ) {
    return [];
  }

  const products = await filterProducts(
    query,
    {},
    'relevancia'
  );

  return products.slice(0, limit);
}

// ─────────────────────────────────────────────────────────────────────────────
// METADADOS
// ─────────────────────────────────────────────────────────────────────────────

export async function getSellers() {
  const products = await getAllProducts();

  return [
    ...new Set(
      products.map(
        (product) =>
          product.supplierName ||
          product.seller
      )
    ),
  ].sort();
}

export async function getPriceRange() {
  const products = await getAllProducts();

  const prices = products
    .map((product) => Number(product.price))
    .filter((price) => !Number.isNaN(price));

  if (prices.length === 0) {
    return {
      min: 0,
      max: 0,
    };
  }

  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}