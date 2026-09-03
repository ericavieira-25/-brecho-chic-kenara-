import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Payment from "./pages/payment/Payment.jsx";
import PixPayment from './pages/PixPayment/PixPayment';

import Layout from './components/layout/Layout/Layout';
import Home from './pages/Home/Home';
import Catalog from './pages/Catalog/Catalog';
import ProductDetail from './pages/ProductDetail/ProductDetail';
import Favorites from './pages/Favorites/Favorites';
import Cart from './pages/Cart/Cart';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Profile from './pages/Profile/Profile';
import Orders from './pages/Orders/Orders';
import OrderDetails from './pages/OrderDetails/OrderDetails';
import AddProduct from "./pages/AddProduct/AddProduct.jsx";
import Confirmation from './pages/Confirmation/Confirmation';

import SupplierPayments from './pages/SupplierPayments/SupplierPayments.jsx';

import AdminDashboard from './pages/AdminDashboard/AdminDashboard.jsx';
import AdminFinancialTable from './pages/AdminFinancialTable/AdminFinancialTable.jsx';
import AdminSuppliers from './pages/AdminSuppliers/AdminSuppliers.jsx';
import SupplierDetails from './pages/SupplierDetails/SupplierDetails.jsx';
import SupplierDashboard from './pages/SupplierDashboard/SupplierDashboard.jsx';
import AdminProducts from './pages/AdminProducts/AdminProducts.jsx';

import AdminLogin from './pages/AdminLogin/AdminLogin.jsx';

import {
  ProtectedRoute,
  AccessDenied,
} from './components/ui/ProtectedRoute/ProtectedRoute.jsx';

import { USER_ROLES } from './data/roles.js';

import NotFound from './pages/NotFound/NotFound';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>

          {/* =========================================
              ROTAS PRINCIPAIS
          ========================================= */}

          <Route path="/" element={<Home />} />

          <Route path="/catalogo" element={<Catalog />} />

          <Route path="/produto/:id" element={<ProductDetail />} />

          <Route path="/favoritos" element={<Favorites />} />

          <Route path="/carrinho" element={<Cart />} />

          {/* Login normal da loja */}
          <Route path="/login" element={<Login />} />

          {/* Login exclusivo da administração */}
          <Route path="/admin/login" element={<AdminLogin />} />

          <Route path="/cadastro" element={<Register />} />

          <Route path="/perfil" element={<Profile />} />

          <Route path="/pedidos" element={<Orders />} />

          <Route
            path="/pedidos/:orderId"
            element={<OrderDetails />}
          />
<Route
  path="/admin/produtos/novo"
  element={
    <ProtectedRoute
      allowedRoles={[USER_ROLES.ADMIN]}
      redirectTo="/admin/login"
    >
      <AddProduct />
    </ProtectedRoute>
  }
/>
```


          <Route
            path="/confirmacao"
            element={<Confirmation />}
          />


          {/* =========================================
              PAGAMENTO PIX
          ========================================= */}

          <Route
            path="/pagamento/pix/:orderId"
            element={<PixPayment />}
          />


          {/* =========================================
              PAGAMENTO PRINCIPAL
          ========================================= */}

          <Route
            path="/pagamento/:orderId"
            element={<Payment />}
          />


          {/* =========================================
              ÁREA ADMINISTRATIVA
          ========================================= */}

          <Route
            path="/admin"
            element={
              <ProtectedRoute
                allowedRoles={[USER_ROLES.ADMIN]}
                redirectTo="/admin/login"
              >
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/tabela-financeira"
            element={
              <ProtectedRoute
                allowedRoles={[USER_ROLES.ADMIN]}
                redirectTo="/admin/login"
              >
                <AdminFinancialTable />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/fornecedoras"
            element={
              <ProtectedRoute
                allowedRoles={[USER_ROLES.ADMIN]}
                redirectTo="/admin/login"
              >
                <AdminSuppliers />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/repasses"
            element={
              <ProtectedRoute
                allowedRoles={[USER_ROLES.ADMIN]}
                redirectTo="/admin/login"
              >
                <SupplierPayments />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/fornecedoras/:supplierId"
            element={
              <ProtectedRoute
                allowedRoles={[USER_ROLES.ADMIN]}
                redirectTo="/admin/login"
              >
                <SupplierDetails />
              </ProtectedRoute>
            }
          />
          <Route
  path="/admin/produtos"
  element={
    <ProtectedRoute
      allowedRoles={[USER_ROLES.ADMIN]}
      redirectTo="/admin/login"
    >
      <AdminProducts />
    </ProtectedRoute>
  }
/>


          {/* =========================================
              ÁREA DA FORNECEDORA
          ========================================= */}

          <Route
            path="/fornecedor"
            element={
              <ProtectedRoute
                allowedRoles={[USER_ROLES.SUPPLIER]}
                redirectTo="/login"
              >
                <SupplierDashboard />
              </ProtectedRoute>
            }
          />


          {/* =========================================
              ACESSO NEGADO
          ========================================= */}

          <Route
            path="/403"
            element={<AccessDenied />}
          />


          {/* =========================================
              PÁGINA 404
          ========================================= */}

          <Route
            path="*"
            element={<NotFound />}
          />

        </Route>
      </Routes>
    </BrowserRouter>
  );
}