import { useState, useEffect } from 'react';
import { salesApi, productApi, customerApi } from '../api';
import { useWarehouse } from '../contexts/WarehouseContext';
import { useAuth } from '../contexts/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { toast } from 'sonner';
import { Plus, CheckCircle, XCircle, ShoppingCart } from 'lucide-react';
import { formatDateTime, formatCurrency, getStatusBadge } from '../utils/helpers';

export default function SalesPage() {
  const { hasRole } = useAuth();
  const { selectedWarehouseId } = useWarehouse();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = () => {
    setLoading(true);
    const params = {};
    if (selectedWarehouseId) params.warehouse_id = selectedWarehouseId;
    if (statusFilter) params.status = statusFilter;
    salesApi.getAll(params)
      .then(r => setData(r.data))
      .catch(() => toast.error('Lỗi tải đơn hàng'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [selectedWarehouseId, statusFilter]);

  const handleApprove = async (row) => {
    try {
      await salesApi.approve(row.id);
      toast.success('Duyệt đơn hàng! Outbound tự động được tạo.');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Duyệt thất bại.'); }
  };

  const handleReject = async (row) => {
    if (!confirm(`Từ chối đơn hàng ${row.sales_order_code}?`)) return;
    try {
      await salesApi.reject(row.id);
      toast.info('Đã từ chối đơn hàng.');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Thất bại.'); }
  };

  const columns = [
    { key: 'sales_order_code', title: 'Mã ĐH', render: v => <code className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-mono">{v}</code> },
    { key: 'customer_name', title: 'Khách hàng' },
    { key: 'warehouse_name', title: 'Kho xuất' },
    { key: 'total_amount', title: 'Tổng tiền', render: v => <span className="font-medium text-green-600">{formatCurrency(parseFloat(v || 0))}</span> },
    { key: 'created_by_name', title: 'Người tạo' },
    { key: 'created_at', title: 'Ngày tạo', render: v => formatDateTime(v) },
    { key: 'status', title: 'Trạng thái', render: v => { const b = getStatusBadge(v); return <span className={b.className}>{b.label}</span>; } },
    {
      key: 'actions', title: 'Thao tác', width: '100px',
      render: (_, row) => (
        <div className="flex gap-1">
          {row.status === 'PENDING' && hasRole('ADMIN', 'MANAGER') && (
            <>
              <button onClick={e => { e.stopPropagation(); handleApprove(row); }} className="p-1.5 hover:bg-green-50 rounded text-green-600" title="Duyệt"><CheckCircle className="w-4 h-4" /></button>
              <button onClick={e => { e.stopPropagation(); handleReject(row); }} className="p-1.5 hover:bg-red-50 rounded text-red-600" title="Từ chối"><XCircle className="w-4 h-4" /></button>
            </>
          )}
        </div>
      )
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Đơn hàng bán</h1>
          <p className="text-sm text-gray-500 mt-1">Tạo và quản lý đơn hàng. Duyệt để tự động tạo phiếu xuất kho</p>
        </div>
        {hasRole('ADMIN', 'SALES') && (
          <button onClick={() => setModal({ open: true, mode: 'create', data: null })} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Tạo đơn hàng
          </button>
        )}
      </div>

      <div className="flex gap-3">
        <select className="select-field max-w-xs" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="PENDING">Chờ duyệt</option>
          <option value="APPROVED">Đã duyệt</option>
          <option value="PROCESSING">Đang xử lý</option>
          <option value="COMPLETED">Hoàn tất</option>
          <option value="REJECTED">Từ chối</option>
        </select>
      </div>

      <DataTable columns={columns} data={data} loading={loading} emptyMessage="Chưa có đơn hàng nào." />

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false })} title="Tạo đơn hàng bán" size="lg">
        <SalesForm
          selectedWarehouseId={selectedWarehouseId}
          onSave={() => { setModal({ open: false }); fetchData(); }}
          onCancel={() => setModal({ open: false })}
        />
      </Modal>
    </div>
  );
}

function SalesForm({ selectedWarehouseId, onSave, onCancel }) {
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState([{ product_id: '', quantity: 1 }]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    customerApi.getAll({}).then(r => setCustomers(r.data)).catch(() => {});
    productApi.getAll({}).then(r => setProducts(r.data)).catch(() => {});
  }, []);

  const addItem = () => setItems([...items, { product_id: '', quantity: 1 }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, val) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: val };
    setItems(updated);
  };

  const totalAmount = items.reduce((sum, item) => {
    const p = products.find(pr => pr.id === parseInt(item.product_id, 10));
    return sum + (p ? parseFloat(p.price) * (item.quantity || 0) : 0);
  }, 0);

  const handleSubmit = async () => {
    if (!selectedWarehouseId) return toast.error('Vui lòng chọn kho từ header.');
    const validItems = items.filter(i => i.product_id && i.quantity > 0);
    if (validItems.length === 0) return toast.error('Cần ít nhất 1 sản phẩm.');
    setSaving(true);
    try {
      await salesApi.create({ warehouse_id: selectedWarehouseId, customer_id: customerId || null, items: validItems });
      toast.success('Tạo đơn hàng thành công!');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Tạo thất bại.');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="label-field">Khách hàng</label>
        <select className="select-field" value={customerId} onChange={e => setCustomerId(e.target.value)}>
          <option value="">-- Chọn khách hàng --</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.customer_code} - {c.name}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="label-field text-xs">Sản phẩm {i + 1}</label>
              <select className="select-field" value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)}>
                <option value="">-- Chọn --</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.sku} - {p.name} ({formatCurrency(parseFloat(p.price))})</option>)}
              </select>
            </div>
            <div className="w-24">
              <label className="label-field text-xs">SL</label>
              <input type="number" className="input-field" value={item.quantity} onChange={e => updateItem(i, 'quantity', parseInt(e.target.value, 10) || 1)} min="1" />
            </div>
            <div className="w-28 text-right text-sm text-green-600 font-medium pt-2">
              {products.find(p => p.id === parseInt(item.product_id, 10))
                ? formatCurrency(parseFloat(products.find(p => p.id === parseInt(item.product_id, 10)).price) * item.quantity)
                : '-'}
            </div>
            {items.length > 1 && <button onClick={() => removeItem(i)} className="p-2 text-red-500 hover:bg-red-50 rounded"><XCircle className="w-4 h-4" /></button>}
          </div>
        ))}
      </div>
      <button onClick={addItem} className="text-sm text-blue-600 hover:text-blue-800">+ Thêm sản phẩm</button>
      <div className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
        <span className="text-sm text-gray-600">Tổng cộng:</span>
        <span className="text-xl font-bold text-green-600">{formatCurrency(totalAmount)}</span>
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t">
        <button onClick={onCancel} className="btn-secondary">Hủy</button>
        <button onClick={handleSubmit} disabled={saving} className="btn-primary">{saving ? 'Đang lưu...' : 'Tạo đơn hàng'}</button>
      </div>
    </div>
  );
}
