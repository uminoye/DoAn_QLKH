import { useState, useEffect } from 'react';
import { outboundApi, productApi } from '../api';
import { useWarehouse } from '../contexts/WarehouseContext';
import { useAuth } from '../contexts/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { toast } from 'sonner';
import { Plus, ArrowUpRight, CheckCircle, XCircle, PackageCheck } from 'lucide-react';
import { formatDateTime, getStatusBadge } from '../utils/helpers';

export default function OutboundPage() {
  const { hasRole } = useAuth();
  const { selectedWarehouseId } = useWarehouse();
  const [data, setData] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = () => {
    setLoading(true);
    const params = {};
    if (selectedWarehouseId) params.warehouse_id = selectedWarehouseId;
    if (statusFilter) params.status = statusFilter;
    outboundApi.getAll(params)
      .then(r => setData(r.data))
      .catch(() => toast.error('Lỗi tải phiếu xuất'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [selectedWarehouseId, statusFilter]);
  useEffect(() => { productApi.getAll({}).then(r => setProducts(r.data)).catch(() => {}); }, []);

  const handleApprove = async (row) => {
    try {
      await outboundApi.approve(row.id);
      toast.success('Duyệt phiếu thành công!');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Duyệt thất bại.'); }
  };

  const handleComplete = async (row) => {
    if (!confirm(`Hoàn tất xuất kho ${row.outbound_code}?\nHệ thống sẽ tự động rút hàng theo FIFO.'`)) return;
    try {
      await outboundApi.complete(row.id);
      toast.success('Hoàn tất xuất kho! Hàng đã được rút theo FIFO.');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Thất bại.'); }
  };

  const handleReject = async (row) => {
    if (!confirm(`Từ chối phiếu ${row.outbound_code}?`)) return;
    try {
      await outboundApi.reject(row.id);
      toast.info('Đã từ chối phiếu.');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Thất bại.'); }
  };

  const columns = [
    { key: 'outbound_code', title: 'Mã phiếu', render: v => <code className="text-xs bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-mono">{v}</code> },
    { key: 'warehouse_name', title: 'Kho' },
    { key: 'created_by_name', title: 'Người tạo' },
    { key: 'created_at', title: 'Ngày tạo', render: v => formatDateTime(v) },
    { key: 'status', title: 'Trạng thái', render: v => { const b = getStatusBadge(v); return <span className={b.className}>{b.label}</span>; } },
    {
      key: 'actions', title: 'Thao tác', width: '200px',
      render: (_, row) => (
        <div className="flex gap-1">
          {row.status === 'PENDING' && hasRole('ADMIN', 'MANAGER') && (
            <>
              <button onClick={e => { e.stopPropagation(); handleApprove(row); }} className="p-1.5 hover:bg-green-50 rounded text-green-600" title="Duyệt"><CheckCircle className="w-4 h-4" /></button>
              <button onClick={e => { e.stopPropagation(); handleReject(row); }} className="p-1.5 hover:bg-red-50 rounded text-red-600" title="Từ chối"><XCircle className="w-4 h-4" /></button>
            </>
          )}
          {row.status === 'APPROVED' && hasRole('ADMIN', 'MANAGER', 'KHO') && (
            <button onClick={e => { e.stopPropagation(); handleComplete(row); }} className="p-1.5 hover:bg-blue-50 rounded text-blue-600" title="Hoàn tất xuất (FIFO)"><PackageCheck className="w-4 h-4" /></button>
          )}
        </div>
      )
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Phiếu Xuất kho</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý xuất hàng. Hệ thống tự động áp dụng FIFO</p>
        </div>
        {hasRole('ADMIN', 'KHO') && (
          <button onClick={() => setModal({ open: true, mode: 'create', data: null })} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Tạo phiếu xuất
          </button>
        )}
      </div>

      <div className="flex gap-3">
        <select className="select-field max-w-xs" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="PENDING">Chờ duyệt</option>
          <option value="APPROVED">Đã duyệt</option>
          <option value="COMPLETED">Hoàn tất</option>
          <option value="REJECTED">Từ chối</option>
        </select>
      </div>

      <DataTable columns={columns} data={data} loading={loading} emptyMessage="Chưa có phiếu xuất nào." />

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false })} title="Tạo phiếu xuất kho" size="lg">
        <OutboundForm
          products={products}
          selectedWarehouseId={selectedWarehouseId}
          onSave={() => { setModal({ open: false }); fetchData(); }}
          onCancel={() => setModal({ open: false })}
        />
      </Modal>
    </div>
  );
}

function OutboundForm({ products, selectedWarehouseId, onSave, onCancel }) {
  const [items, setItems] = useState([{ product_id: '', requested_quantity: 1 }]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const addItem = () => setItems([...items, { product_id: '', requested_quantity: 1 }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, val) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: val };
    setItems(updated);
  };

  const handleSubmit = async () => {
    if (!selectedWarehouseId) return toast.error('Vui lòng chọn kho từ header.');
    const validItems = items.filter(i => i.product_id && i.requested_quantity > 0);
    if (validItems.length === 0) return toast.error('Cần ít nhất 1 sản phẩm.');
    setSaving(true);
    try {
      await outboundApi.create({ warehouse_id: selectedWarehouseId, notes, items: validItems });
      toast.success('Tạo phiếu xuất thành công!');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Tạo thất bại.');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="p-3 bg-red-50 rounded-lg text-sm text-red-800">
        Xuất từ kho: <strong>{selectedWarehouseId || 'Chưa chọn'}</strong>. Hệ thống sẽ tự động chọn hàng theo thứ tự FIFO (nhập trước xuất trước).
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="label-field text-xs">Sản phẩm {i + 1}</label>
              <select className="select-field" value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)}>
                <option value="">-- Chọn sản phẩm --</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>)}
              </select>
            </div>
            <div className="w-28">
              <label className="label-field text-xs">Số lượng</label>
              <input type="number" className="input-field" value={item.requested_quantity} onChange={e => updateItem(i, 'requested_quantity', parseInt(e.target.value, 10) || 1)} min="1" />
            </div>
            {items.length > 1 && <button onClick={() => removeItem(i)} className="p-2 text-red-500 hover:bg-red-50 rounded"><XCircle className="w-4 h-4" /></button>}
          </div>
        ))}
      </div>
      <button onClick={addItem} className="text-sm text-blue-600 hover:text-blue-800">+ Thêm sản phẩm</button>
      <div><label className="label-field">Ghi chú</label><textarea className="input-field" rows="2" value={notes} onChange={e => setNotes(e.target.value)} /></div>
      <div className="flex justify-end gap-2 pt-4 border-t">
        <button onClick={onCancel} className="btn-secondary">Hủy</button>
        <button onClick={handleSubmit} disabled={saving} className="btn-primary">{saving ? 'Đang lưu...' : 'Tạo phiếu'}</button>
      </div>
    </div>
  );
}
