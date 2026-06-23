import { useState, useEffect } from 'react';
import { customerApi } from '../api';
import { useAuth } from '../contexts/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { toast } from 'sonner';
import { Plus, Users, Edit, Trash2 } from 'lucide-react';

export default function CustomersPage() {
  const { hasRole } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });

  const fetchData = () => {
    setLoading(true);
    customerApi.getAll({ search }).then(r => setData(r.data)).catch(() => toast.error('Lỗi tải khách hàng')).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [search]);

  const handleSave = async (formData) => {
    try {
      if (modal.mode === 'create') {
        await customerApi.create(formData);
        toast.success('Tạo khách hàng thành công!');
      } else {
        await customerApi.update(modal.data.id, formData);
        toast.success('Cập nhật thành công!');
      }
      setModal({ open: false, mode: 'create', data: null });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi lưu.');
    }
  };

  const handleDelete = async (row) => {
    if (!confirm(`Xóa khách hàng "${row.name}"?`)) return;
    try {
      await customerApi.delete(row.id);
      toast.success('Xóa thành công!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xóa thất bại.');
    }
  };

  const columns = [
    { key: 'customer_code', title: 'Mã KH', render: v => <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">{v}</code> },
    { key: 'name', title: 'Tên khách hàng', render: v => <span className="font-medium text-gray-900">{v}</span> },
    { key: 'phone', title: 'Điện thoại' },
    { key: 'email', title: 'Email', render: v => v || <span className="text-gray-400">-</span> },
    { key: 'address', title: 'Địa chỉ', render: v => v || <span className="text-gray-400">-</span> },
    {
      key: 'actions', title: 'Thao tác', width: '100px',
      render: (_, row) => (
        <div className="flex gap-1">
          {hasRole('ADMIN', 'SALES') && (
            <>
              <button onClick={e => { e.stopPropagation(); setModal({ open: true, mode: 'edit', data: row }); }} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600"><Edit className="w-4 h-4" /></button>
              {hasRole('ADMIN') && <button onClick={e => { e.stopPropagation(); handleDelete(row); }} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>}
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
          <h1 className="page-header">Khách hàng</h1>
          <p className="text-sm text-gray-500 mt-1">Danh sách đối tác, đại lý, khách sỉ</p>
        </div>
        {hasRole('ADMIN', 'SALES') && (
          <button onClick={() => setModal({ open: true, mode: 'create', data: null })} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Thêm khách hàng
          </button>
        )}
      </div>
      <div className="flex gap-3">
        <input className="input-field max-w-xs" placeholder="Tìm kiếm tên, mã KH, SĐT..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <DataTable columns={columns} data={data} loading={loading} emptyMessage="Chưa có khách hàng nào." />
      <Modal isOpen={modal.open} onClose={() => setModal({ open: false })} title={modal.mode === 'create' ? 'Thêm khách hàng' : 'Sửa khách hàng'} size="md">
        <CustomerForm initialData={modal.data} onSave={handleSave} onCancel={() => setModal({ open: false })} />
      </Modal>
    </div>
  );
}

function CustomerForm({ initialData, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    address: initialData?.address || '',
  });
  return (
    <div className="space-y-4">
      <div><label className="label-field">Tên khách hàng *</label><input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label-field">Điện thoại</label><input className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
        <div><label className="label-field">Email</label><input type="email" className="input-field" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
      </div>
      <div><label className="label-field">Địa chỉ</label><textarea className="input-field" rows="2" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
      <div className="flex justify-end gap-2 pt-4 border-t">
        <button onClick={onCancel} className="btn-secondary">Hủy</button>
        <button onClick={() => form.name.trim() && onSave(form)} className="btn-primary" disabled={!form.name.trim()}>Lưu</button>
      </div>
    </div>
  );
}
