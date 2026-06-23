import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './layouts/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import WarehousesPage from './pages/WarehousesPage';
import ProductsPage from './pages/ProductsPage';
import CategoriesPage from './pages/CategoriesPage';
import CustomersPage from './pages/CustomersPage';
import InventoryPage from './pages/InventoryPage';
import InboundPage from './pages/InboundPage';
import OutboundPage from './pages/OutboundPage';
import SalesPage from './pages/SalesPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="text-gray-500">Đang tải...</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="warehouses" element={<ProtectedRoute roles={['ADMIN', 'MANAGER']}><WarehousesPage /></ProtectedRoute>} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="categories" element={<ProtectedRoute roles={['ADMIN']}><CategoriesPage /></ProtectedRoute>} />
        <Route path="customers" element={<ProtectedRoute roles={['ADMIN', 'MANAGER', 'SALES']}><CustomersPage /></ProtectedRoute>} />
        <Route path="inventory" element={<ProtectedRoute roles={['ADMIN', 'MANAGER', 'KHO']}><InventoryPage /></ProtectedRoute>} />
        <Route path="inbound" element={<ProtectedRoute roles={['ADMIN', 'MANAGER', 'KHO']}><InboundPage /></ProtectedRoute>} />
        <Route path="outbound" element={<ProtectedRoute roles={['ADMIN', 'MANAGER', 'KHO']}><OutboundPage /></ProtectedRoute>} />
        <Route path="sales" element={<ProtectedRoute roles={['ADMIN', 'MANAGER', 'SALES']}><SalesPage /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute roles={['ADMIN', 'MANAGER']}><ReportsPage /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute roles={['ADMIN']}><UsersPage /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
