import { useState, useEffect } from 'react';
import { inventoryApi } from '../api';
import { useWarehouse } from '../contexts/WarehouseContext';
import DataTable from '../components/DataTable';
import { toast } from 'sonner';
import { formatCurrency } from '../utils/helpers';

export default function InventoryPage() {
  const { selectedWarehouseId, warehouses } = useWarehouse();
  const [pivotData, setPivotData] = useState({ columns: [], rows: [], warehouses: [] });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('pivot');

  useEffect(() => {
    setLoading(true);
    inventoryApi.getPivot()
      .then(r => setPivotData(r.data))
      .catch(() => toast.error('Lỗi tải tồn kho'))
      .finally(() => setLoading(false));
  }, []);

  const warehouse = warehouses.find(w => w.id === selectedWarehouseId);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Đang tải dữ liệu...</div></div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-header">Báo cáo Tồn kho Đa Kho</h1>
        <p className="text-sm text-gray-500 mt-1">Tổng hợp số lượng hàng tồn theo từng chi nhánh</p>
      </div>

      {/* Warehouse capacity cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {warehouses.map(w => {
          const pct = w.capacity_percent || 0;
          const color = pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-amber-500' : 'bg-green-500';
          return (
            <div key={w.id} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{w.name}</span>
                <span className="text-sm text-gray-500">{w.bins_used}/{w.bins_total} kệ</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
              </div>
              <div className="text-right text-xs text-gray-500 mt-1">{pct}% sử dụng</div>
            </div>
          );
        })}
      </div>

      {/* Pivot Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Bảng tồn kho theo sản phẩm</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-left">SKU</th>
                <th className="px-4 py-3 text-left">Tên sản phẩm</th>
                {pivotData.warehouses.map((w, i) => (
                  <th key={i} className="px-4 py-3 text-right">{w}</th>
                ))}
                <th className="px-4 py-3 text-right font-semibold">Tổng</th>
              </tr>
            </thead>
            <tbody>
              {pivotData.rows.length === 0 ? (
                <tr><td colSpan={pivotData.warehouses.length + 3} className="px-4 py-8 text-center text-gray-400">Không có dữ liệu</td></tr>
              ) : pivotData.rows.map(row => {
                const total = pivotData.rows.find(r => r.id === row.id)?.total || 0;
                return (
                  <tr key={row.id} className="table-row">
                    <td className="px-4 py-3"><code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">{row.sku}</code></td>
                    <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                    {pivotData.warehouses.map((_, i) => {
                      const whId = pivotData.columns.find(c => c.startsWith('warehouse_'))?.replace('warehouse_', '');
                      const val = row[`warehouse_${i + 1}`] || 0;
                      return <td key={i} className="px-4 py-3 text-right text-blue-600 font-medium">{parseInt(val, 10).toLocaleString()}</td>;
                    })}
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{total.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
