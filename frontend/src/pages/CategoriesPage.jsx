import { useState, useEffect } from 'react';
import { categoryApi } from '../api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Tags } from 'lucide-react';

export default function CategoriesPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });

  const fetchData = () => {
    setLoading(true);
    categoryApi.getAll().then(r => setData(r.data)).catch(() => toast.error('Lỗi tải danh mục')).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (formData) => {
    try {
      if (modal.mode === 'create') {
        await categoryApi.create(formData);
        toast.success('Tạo danh mục thành công!');
      } else {
        await categoryApi.update(modal.data.id, formData);
        toast.success('Cập nhật thành công!');
      }
      setModal({ open: false, mode: 'create', data: null });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi lưu.');
    }
  };

  const handleDelete = async (row) => {
    if (!confirm(`Xóa danh mục "${row.name}"?`)) return;
    try {
      await categoryApi.delete(row.id);
      toast.success('Xóa thành công!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xóa thất bại.');
    }
  };

  const columns = [
    { key: 'name', title: 'Tên danh mục', render: v => <span className="font-medium text-gray-900">{v}</span> },
    { key: 'description', title: 'Mô tả', render: v => v || <span className="text-gray-400">-</span> },
    {
      key: 'actions', title: 'Thao tác', width: '100px',
      render: (_, row) => (
        <div className="flex gap-1">
          <button onClick={e => { e.stopPropagation(); setModal({ open: true, mode: 'edit', data: row }); }} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600"><Edit className="w-4 h-4" /></button>
          <button onClick={e => { e.stopPropagation(); handleDelete(row); }} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Danh mục sản phẩm</h1>
          <p className="text-sm text-gray-500 mt-1">Phân loại hàng hóa theo nhóm</p>
        </div>
        <button onClick={() => setModal({ open: true, mode: 'create', data: null })} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Thêm danh mục
        </button>
      </div>
      <DataTable columns={columns} data={data} loading={loading} emptyMessage="Chưa có danh mục nào." />
      <Modal isOpen={modal.open} onClose={() => setModal({ open: false })} title={modal.mode === 'create' ? 'Thêm danh mục' : 'Sửa danh mục'} size="sm">
        <CategoryForm initialData={modal.data} onSave={handleSave} onCancel={() => setModal({ open: false })} />
      </Modal>
    </div>
  );
}

function CategoryForm({ initialData, onSave, onCancel }) {
  const [form, setForm] = useState({ name: initialData?.name || '', description: initialData?.description || '' });
  return (
    <div className="space-y-4">
      <div><label className="label-field">Tên danh mục *</label><input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
      <div><label className="label-field">Mô tả</label><textarea className="input-field" rows="3" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
      <div className="flex justify-end gap-2 pt-4 border-t">
        <button onClick={onCancel} className="btn-secondary">Hủy</button>
        <button onClick={() => form.name.trim() && onSave(form)} className="btn-primary" disabled={!form.name.trim()}>Lưu</button>
      </div>
    </div>
  );
}
