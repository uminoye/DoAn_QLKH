import { useState, useEffect } from 'react';
import { warehouseApi } from '../api';
import { useAuth } from '../contexts/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { toast } from 'sonner';
import { Plus, Warehouse, Edit, Trash2 } from 'lucide-react';

export default function WarehousesPage() {
  const { hasRole } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });

  const fetchData = () => {
    setLoading(true);
    warehouseApi.getAll().then(r => setData(r.data)).catch(() => toast.error('Lỗi tải kho')).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (formData) => {
    try {
      if (modal.mode === 'create') {
        await warehouseApi.create(formData);
        toast.success('Tạo kho thành công!');
      } else {
        await warehouseApi.update(modal.data.id, formData);
        toast.success('Cập nhật thành công!');
      }
      setModal({ open: false, mode: 'create', data: null });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi lưu.');
    }
  };

  const handleDelete = async (row) => {
    if (!confirm(`Xóa kho "${row.name}"?`)) return;
    try {
      await warehouseApi.delete(row.id);
      toast.success('Xóa thành công!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xóa thất bại.');
    }
  };

  const columns = [
    { key: 'name', title: 'Tên kho', render: v => <span className="font-medium text-gray-900">{v}</span> },
    { key: 'address', title: 'Địa chỉ' },
    { key: 'bins_total', title: 'Tổng kệ', render: v => <span className="text-gray-600">{v || 0}</span> },
    { key: 'bins_used', title: 'Đã dùng', render: v => <span className="text-blue-600 font-medium">{v || 0}</span> },
    {
      key: 'capacity_percent', title: 'Sức chứa',
      render: (v) => {
        const pct = v || 0;
        const color = pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-amber-500' : 'bg-green-500';
        return (
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-gray-600">{pct}%</span>
          </div>
        );
      }
    },
    {
      key: 'actions', title: 'Thao tác', width: '120px',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); setModal({ open: true, mode: 'edit', data: row }); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600">
            <Edit className="w-4 h-4" />
          </button>
          {hasRole('ADMIN') && (
            <button onClick={(e) => { e.stopPropagation(); handleDelete(row); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-600">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Quản lý Kho</h1>
          <p className="text-sm text-gray-500 mt-1">Danh sách chi nhánh kho hàng</p>
        </div>
        {hasRole('ADMIN') && (
          <button onClick={() => setModal({ open: true, mode: 'create', data: null })} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Tạo kho mới
          </button>
        )}
      </div>

      <DataTable columns={columns} data={data} loading={loading} emptyMessage="Chưa có kho nào." />

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false })} title={modal.mode === 'create' ? 'Tạo kho mới' : 'Sửa kho'} size="md">
        <WarehouseForm initialData={modal.data} onSave={handleSave} onCancel={() => setModal({ open: false })} />
      </Modal>
    </div>
  );
}

function WarehouseForm({ initialData, onSave, onCancel }) {
  const [form, setForm] = useState({ name: initialData?.name || '', address: initialData?.address || '', total_capacity: initialData?.total_capacity || 100 });
  return (
    <div className="space-y-4">
      <div>
        <label className="label-field">Tên kho *</label>
        <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="VD: Kho Tổng Hà Nội" />
      </div>
      <div>
        <label className="label-field">Địa chỉ</label>
        <input className="input-field" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Địa chỉ kho" />
      </div>
      <div>
        <label className="label-field">Sức chứa (số kệ) *</label>
        <input type="number" className="input-field" value={form.total_capacity} onChange={e => setForm({ ...form, total_capacity: parseInt(e.target.value, 10) || 0 })} min="0" max="10000" />
        <p className="text-xs text-gray-500 mt-1">Hệ thống sẽ tự động sinh mã kệ (VD: A-A1-R1-S1-B1) theo số lượng này.</p>
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t">
        <button onClick={onCancel} className="btn-secondary">Hủy</button>
        <button onClick={() => onSave(form)} className="btn-primary" disabled={!form.name.trim()}>Lưu</button>
      </div>
    </div>
  );
}
