/**
 * formatters.js
 * Utilitários de formatação e transformação de dados.
 */

// ─── Preços ──────────────────────────────────────────────────────────────────

export function formatPrice(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Calcula o percentual de desconto inteiro.
 * Retorna 0 se não houver desconto.
 */
export function calcDiscount(originalPrice, price) {
  if (!originalPrice || originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

// ─── Datas ────────────────────────────────────────────────────────────────────

export function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/**
 * Retorna uma data relativa legível em pt-BR.
 * Ex: "há 3 dias", "há 2 meses"
 */
export function formatRelativeDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `há ${diffDays} dias`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `há ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `há ${months} ${months === 1 ? 'mês' : 'meses'}`;
  }
  const years = Math.floor(diffDays / 365);
  return `há ${years} ${years === 1 ? 'ano' : 'anos'}`;
}

// ─── Texto ────────────────────────────────────────────────────────────────────

export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

// ─── Produtos ────────────────────────────────────────────────────────────────

/** Rótulo legível da condição da peça. */
export function getConditionLabel(condition) {
  const map = {
    otimo: 'Ótimo estado',
    bom: 'Bom estado',
    regular: 'Estado regular',
  };
  return map[condition] || condition;
}

/** Rótulo curto da condição (para badges compactos). */
export function getConditionShortLabel(condition) {
  const map = { otimo: 'Ótimo', bom: 'Bom', regular: 'Regular' };
  return map[condition] || condition;
}

/**
 * Retorna o nome legível de uma categoria pelo slug.
 * Requer a lista de categorias como segundo argumento para evitar importação circular.
 */
export function getCategoryLabel(slug, categories) {
  return categories.find((c) => c.id === slug)?.name ?? slug;
}

// ─── Pedidos ─────────────────────────────────────────────────────────────────

export function getStatusLabel(status) {
  const map = {
    aguardando_pagamento: 'Aguardando pagamento',
    pago: 'Pagamento confirmado',
    processando: 'Processando',
    em_transito: 'Em trânsito',
    entregue: 'Entregue',
    cancelado: 'Cancelado',
  };

  return map[status] || status;
}