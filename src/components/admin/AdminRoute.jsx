import { Navigate, Outlet } from 'react-router-dom';

export default function AdminRoute() {
  const isAdmin = localStorage.getItem('kenara_admin') === 'true';

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}