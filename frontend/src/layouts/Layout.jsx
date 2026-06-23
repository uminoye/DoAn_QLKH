import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWarehouse } from '../contexts/WarehouseContext';
import { getRoleLabel } from '../utils/helpers';
import {
  LayoutDashboard, Warehouse, Package, Tags, Users,
  ShoppingCart, ArrowDownLeft, ArrowUpRight, ClipboardList,
  BarChart3, Settings, LogOut, ChevronDown, Menu, X
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'KHO', 'SALES'] },
  { path: '/warehouses', label: 'Quản lý Kho', icon: Warehouse, roles: ['ADMIN', 'MANAGER'] },
  { path: '/products', label: 'Sản phẩm', icon: Package, roles: ['ADMIN', 'MANAGER', 'KHO', 'SALES'] },
  { path: '/categories', label: 'Danh mục', icon: Tags, roles: ['ADMIN'] },
  { path: '/customers', label: 'Khách hàng', icon: Users, roles: ['ADMIN', 'MANAGER', 'SALES'] },
  { path: '/inventory', label: 'Tồn kho', icon: ClipboardList, roles: ['ADMIN', 'MANAGER', 'KHO'] },
  { path: '/inbound', label: 'Nhập kho', icon: ArrowDownLeft, roles: ['ADMIN', 'MANAGER', 'KHO'] },
  { path: '/outbound', label: 'Xuất kho', icon: ArrowUpRight, roles: ['ADMIN', 'MANAGER', 'KHO'] },
  { path: '/sales', label: 'Đơn hàng', icon: ShoppingCart, roles: ['ADMIN', 'MANAGER', 'SALES'] },
  { path: '/reports', label: 'Báo cáo', icon: BarChart3, roles: ['ADMIN', 'MANAGER'] },
  { path: '/users', label: 'Người dùng', icon: Settings, roles: ['ADMIN'] },
];

export default function Layout() {
  const { user, logout, hasRole } = useAuth();
  const { warehouses, selectedWarehouseId, selectWarehouse } = useWarehouse();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleNav = NAV_ITEMS.filter(item => hasRole(...item.roles));

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-56 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center h-16 px-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Warehouse className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm">WMS</span>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <nav className="mt-4 px-2 space-y-1 overflow-y-auto h-[calc(100vh-64px)]">
          {visibleNav.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col lg:ml-56">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5 text-gray-600" />
            </button>

            {hasRole('ADMIN', 'MANAGER', 'KHO') && warehouses.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">KHO:</span>
                <select
                  value={selectedWarehouseId || ''}
                  onChange={e => selectWarehouse(parseInt(e.target.value, 10))}
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-2 py-1.5 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-700 font-semibold text-sm">{user?.full_name?.charAt(0) || 'U'}</span>
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-gray-900">{user?.full_name}</div>
                  <div className="text-xs text-gray-500">{getRoleLabel(user?.role)}</div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <div className="text-sm font-medium">{user?.full_name}</div>
                      <div className="text-xs text-gray-500">{user?.email}</div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
