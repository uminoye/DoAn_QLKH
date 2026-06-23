import { useState, useEffect } from 'react';
import { reportApi } from '../api';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../utils/helpers';

export default function ReportsPage() {
  const [invSummary, setInvSummary] = useState([]);
  const [inboundSummary, setInboundSummary] = useState([]);
  const [outboundSummary, setOutboundSummary] = useState([]);
  const [salesSummary, setSalesSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      reportApi.getInventorySummary(),
      reportApi.getInboundSummary(),
      reportApi.getOutboundSummary(),
      reportApi.getSalesSummary(),
    ])
      .then(([inv, inbound, outbound, sales]) => {
        setInvSummary(inv.data);
        setInboundSummary(inbound.data);
        setOutboundSummary(outbound.data);
        setSalesSummary(sales.data);
      })
      .catch(() => toast.error('Lỗi tải báo cáo'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Đang tải báo cáo...</div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header">Báo cáo Tổng hợp</h1>
        <p className="text-sm text-gray-500 mt-1">Thống kê toàn bộ hoạt động kho hàng</p>
      </div>

      {/* Inventory Summary */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Tồn kho theo Kho</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-left">Kho</th>
                <th className="px-4 py-3 text-right">Tổng kệ</th>
                <th className="px-4 py-3 text-right">Kệ đã dùng</th>
                <th className="px-4 py-3 text-right">Sản phẩm</th>
                <th className="px-4 py-3 text-right">Tổng tồn</th>
              </tr>
            </thead>
            <tbody>
              {invSummary.map(row => (
                <tr key={row.warehouse_id} className="table-row">
                  <td className="px-4 py-3 font-medium">{row.warehouse_name}</td>
                  <td className="px-4 py-3 text-right">{row.total_bins}</td>
                  <td className="px-4 py-3 text-right text-blue-600">{row.used_bins}</td>
                  <td className="px-4 py-3 text-right">{row.unique_products}</td>
                  <td className="px-4 py-3 text-right font-medium text-green-600">{parseInt(row.total_quantity, 10).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inbound vs Outbound */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Tổng hợp Nhập kho</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3 text-left">Kho</th>
                  <th className="px-4 py-3 text-right">Tổng phiếu</th>
                  <th className="px-4 py-3 text-right">Đã duyệt</th>
                  <th className="px-4 py-3 text-right">Từ chối</th>
                </tr>
              </thead>
              <tbody>
                {inboundSummary.map(row => (
                  <tr key={row.warehouse_name} className="table-row">
                    <td className="px-4 py-3">{row.warehouse_name}</td>
                    <td className="px-4 py-3 text-right">{row.total_orders}</td>
                    <td className="px-4 py-3 text-right text-green-600">{row.approved}</td>
                    <td className="px-4 py-3 text-right text-red-600">{row.rejected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Tổng hợp Xuất kho</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3 text-left">Kho</th>
                  <th className="px-4 py-3 text-right">Tổng phiếu</th>
                  <th className="px-4 py-3 text-right">Hoàn tất</th>
                  <th className="px-4 py-3 text-right">Từ chối</th>
                </tr>
              </thead>
              <tbody>
                {outboundSummary.map(row => (
                  <tr key={row.warehouse_name} className="table-row">
                    <td className="px-4 py-3">{row.warehouse_name}</td>
                    <td className="px-4 py-3 text-right">{row.total_orders}</td>
                    <td className="px-4 py-3 text-right text-green-600">{row.completed}</td>
                    <td className="px-4 py-3 text-right text-red-600">{row.rejected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sales Chart */}
      {salesSummary.length > 0 && (
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Doanh thu theo tháng</h3>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesSummary.map(s => ({
                month: new Date(s.month).toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' }),
                revenue: parseFloat(s.total_revenue || 0),
                orders: s.completed,
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(v, name) => [name === 'revenue' ? formatCurrency(v) : v, name === 'revenue' ? 'Doanh thu' : 'Đơn hoàn tất']} />
                <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
