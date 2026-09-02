export const suppliers = [
  {
    id: 'supplier-ana-carol',
    name: 'Ana Carol',
    status: 'active',
    createdAt: '2023-08-12',
    contact: { email: 'ana@brecho-demo.com', phone: '(11) 98888-1234' },
    userId: 'user-supplier-ana',
  },
  {
    id: 'supplier-rafa-alves',
    name: 'Rafa Alves',
    status: 'active',
    createdAt: '2023-09-03',
    contact: { email: 'rafa@brecho-demo.com', phone: '(21) 97777-4321' },
    userId: 'user-supplier-rafa',
  },
  {
    id: 'supplier-bea-oliveira',
    name: 'Bea Oliveira',
    status: 'active',
    createdAt: '2023-10-20',
    contact: { email: 'bea@brecho-demo.com', phone: '(41) 99999-8790' },
    userId: 'user-supplier-bea',
  },
  {
    id: 'supplier-julia-lima',
    name: 'Julia Lima',
    status: 'active',
    createdAt: '2023-11-02',
    contact: { email: 'julia@brecho-demo.com', phone: '(48) 98888-3344' },
    userId: 'user-supplier-julia',
  },
  {
    id: 'supplier-paty-rocha',
    name: 'Paty Rocha',
    status: 'active',
    createdAt: '2023-12-01',
    contact: { email: 'paty@brecho-demo.com', phone: '(31) 97777-6655' },
    userId: 'user-supplier-paty',
  },
  {
    id: 'supplier-gi-mendes',
    name: 'Gi Mendes',
    status: 'active',
    createdAt: '2024-01-14',
    contact: { email: 'gi@brecho-demo.com', phone: '(81) 98888-4545' },
    userId: 'user-supplier-gi',
  },
  {
    id: 'supplier-carol-melo',
    name: 'Carol Melo',
    status: 'active',
    createdAt: '2024-02-08',
    contact: { email: 'carol@brecho-demo.com', phone: '(51) 98888-7113' },
    userId: 'user-supplier-carol',
  },
  {
    id: 'supplier-mari-santos',
    name: 'Mari Santos',
    status: 'active',
    createdAt: '2024-03-01',
    contact: { email: 'mari@brecho-demo.com', phone: '(11) 97777-9988' },
    userId: 'user-supplier-mari',
  },
  {
    id: 'supplier-fe-costa',
    name: 'Fê Costa',
    status: 'active',
    createdAt: '2024-03-20',
    contact: { email: 'fe@brecho-demo.com', phone: '(71) 98888-2221' },
    userId: 'user-supplier-fe',
  },
];

export function getSupplierById(supplierId) {
  return suppliers.find((supplier) => supplier.id === supplierId);
}

export function getSupplierByUserId(userId) {
  return suppliers.find((supplier) => supplier.userId === userId);
}

export function getSupplierByName(name) {
  return suppliers.find((supplier) => supplier.name === name);
}

export function getSupplierDisplayName(supplierOrProduct) {
  if (!supplierOrProduct) return 'Fornecedora';
  if (typeof supplierOrProduct === 'string') {
    return getSupplierById(supplierOrProduct)?.name || supplierOrProduct;
  }
  if (supplierOrProduct.name && supplierOrProduct.contact) {
    return supplierOrProduct.name;
  }
  return getSupplierById(supplierOrProduct.supplierId)?.name || supplierOrProduct.seller || 'Fornecedora';
}
