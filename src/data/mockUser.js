import { USER_ROLES } from './roles.js';

/**
 * Dados de demonstração para a etapa atual.
 * Este mock deve ser substituído por autenticação real em uma integração futura.
 */
export const mockUser = {
  id: 'user-demo-client',
  name: 'Ana Carolina',
  email: 'demo@brecho.com',
  password: '123456',
  role: USER_ROLES.CLIENT,
  avatar: 'https://picsum.photos/seed/user-ana/200/200',
  phone: '(11) 99999-8888',
  address: 'Rua das Flores, 123 - São Paulo, SP',
  createdAt: '2023-06-15',
};

export const demoUsers = [
  mockUser,
  {
    id: 'user-demo-supplier',
    name: 'Ana Carol Fornecedora',
    email: 'fornecedora@brecho.com',
    password: '123456',
    role: USER_ROLES.SUPPLIER,
    supplierId: 'supplier-ana-carol',
    avatar: 'https://picsum.photos/seed/user-supplier/200/200',
    phone: '(11) 99888-2222',
    address: 'Rua da Moda, 40 - São Paulo, SP',
    createdAt: '2023-06-16',
  },
  {
    id: 'user-demo-admin',
    name: 'Administradora Kenara',
    email: 'admin@brecho.com',
    password: 'kenara25@',
    role: USER_ROLES.ADMIN,
    avatar: 'https://picsum.photos/seed/user-admin/200/200',
    phone: '(11) 97777-1111',
    address: 'Av. da Gestão, 90 - São Paulo, SP',
    createdAt: '2023-06-17',
  },
];

export const mockOrders = [
  {
    id: 'PED-2024-001',
    date: '2024-01-15',
    status: 'entregue',
    total: 189.9,
    items: [
      { name: 'Vestido Floral Vintage', qty: 1, price: 89.9, image: 'https://picsum.photos/seed/prod-1/300/400' },
      { name: 'Blusa de Seda Rose', qty: 1, price: 100.0, image: 'https://picsum.photos/seed/prod-3/300/400' },
    ],
  },
  {
    id: 'PED-2024-002',
    date: '2024-02-20',
    status: 'em_transito',
    total: 145.0,
    items: [
      { name: 'Saia Midi Estampada', qty: 1, price: 145.0, image: 'https://picsum.photos/seed/prod-7/300/400' },
    ],
  },
  {
    id: 'PED-2024-003',
    date: '2024-03-05',
    status: 'processando',
    total: 220.0,
    items: [
      { name: 'Casaco Trench Coat Clássico', qty: 1, price: 220.0, image: 'https://picsum.photos/seed/prod-9/300/400' },
    ],
  },
];
