import { useState, useEffect } from 'react';
import { reportApi } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/helpers';
import {
  Warehouse, Package, Users, ClipboardList,
  ArrowDownLeft, ArrowUpRight, ShoppingCart, TrendingUp
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StatCard = ({ icon: Icon, label, value, color, onClick }) => (
  <div
    onClick={onClick}
    className={`card p-5 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
  >
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm text-gray-500 font-medium">{label}</div>
        <div className={`text-2xl font-bold mt-1 ${color}`}>{value}</div>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color.replace('text-', 'bg-')}/10`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const { hasRole } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportApi.getDashboard()
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Đang tải dữ liệu...</div>
      </div>
    );
  }

  const role = stats; // placeholder for role-based data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header">Tổng quan hệ thống</h1>
        <p className="text-sm text-gray-500 mt-1">Chào mừng bạn quay trở lại!</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {hasRole('ADMIN', 'MANAGER') && (
          <StatCard icon={Warehouse} label="Số Kho" value={stats?.total_warehouses || 0} color="text-blue-600" />
        )}
        {hasRole('ADMIN', 'MANAGER', 'KHO') && (
          <StatCard icon={ClipboardList} label="Tổng Tồn kho" value={stats?.total_inventory || 0} color="text-green-600" />
        )}
        {hasRole('ADMIN', 'MANAGER', 'SALES') && (
          <StatCard icon={ShoppingCart} label="Chờ duyệt đơn" value={stats?.pending_sales || 0} color="text-purple-600" />
        )}
        {hasRole('ADMIN', 'MANAGER') && (
          <StatCard icon={Package} label="Sản phẩm" value={stats?.total_products || 0} color="text-orange-600" />
        )}
        {hasRole('ADMIN', 'MANAGER', 'KHO') && (
          <StatCard icon={ArrowDownLeft} label="Phiếu Nhập chờ" value={stats?.pending_inbound || 0} color="text-teal-600" />
        )}
        {hasRole('ADMIN', 'MANAGER', 'KHO') && (
          <StatCard icon={ArrowUpRight} label="Phiếu Xuất chờ" value={stats?.pending_outbound || 0} color="text-red-600" />
        )}
        {hasRole('ADMIN', 'MANAGER', 'SALES') && (
          <StatCard icon={Users} label="Khách hàng" value={stats?.total_customers || 0} color="text-indigo-600" />
        )}
      </div>

      {/* Pending Approvals */}
      {(stats?.pending_sales > 0 || stats?.pending_inbound > 0 || stats?.pending_outbound > 0) && hasRole('ADMIN', 'MANAGER') && (
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              Công việc cần xử lý
            </h3>
          </div>
          <div className="p-5 space-y-3">
            {stats.pending_inbound > 0 && (
              <div className="flex items-center justify-between p-3 bg-teal-50 rounded-lg">
                <span className="text-sm text-teal-800">Phiếu nhập kho chờ duyệt</span>
                <span className="badge-warning">{stats.pending_inbound} phiếu</span>
              </div>
            )}
            {stats.pending_outbound > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-sm text-red-800">Phiếu xuất kho chờ duyệt</span>
                <span className="badge-warning">{stats.pending_outbound} phiếu</span>
              </div>
            )}
            {stats.pending_sales > 0 && (
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <span className="text-sm text-purple-800">Đơn hàng bán chờ duyệt</span>
                <span className="badge-warning">{stats.pending_sales} đơn</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
