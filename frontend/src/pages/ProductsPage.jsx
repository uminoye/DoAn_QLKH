import { useState, useEffect } from 'react';
import { productApi, categoryApi } from '../api';
import { useAuth } from '../contexts/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { toast } from 'sonner';
import { Plus, Package, Edit, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

export default function ProductsPage() {
  const { hasRole } = useAuth();
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });

  const fetchData = () => {
    setLoading(true);
    productApi.getAll({ search, category_id: filterCat })
      .then(r => setData(r.data))
      .catch(() => toast.error('Lỗi tải sản phẩm'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [search, filterCat]);

  useEffect(() => {
    categoryApi.getAll().then(r => setCategories(r.data)).catch(() => {});
  }, []);

  const handleSave = async (formData) => {
    try {
      if (modal.mode === 'create') {
        await productApi.create(formData);
        toast.success('Tạo sản phẩm thành công!');
      } else {
        await productApi.update(modal.data.id, formData);
        toast.success('Cập nhật thành công!');
      }
      setModal({ open: false, mode: 'create', data: null });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi lưu.');
    }
  };

  const handleDelete = async (row) => {
    if (!confirm(`Xóa sản phẩm "${row.name}"?`)) return;
    try {
      await productApi.delete(row.id);
      toast.success('Xóa thành công!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xóa thất bại.');
    }
  };

  const columns = [
    { key: 'sku', title: 'Mã SKU', render: v => <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">{v}</code> },
    { key: 'name', title: 'Tên sản phẩm', render: v => <span className="font-medium text-gray-900">{v}</span> },
    { key: 'category_name', title: 'Danh mục', render: v => v || <span className="text-gray-400">-</span> },
    { key: 'unit', title: 'Đơn vị' },
    { key: 'price', title: 'Giá bán', render: v => <span className="text-green-600 font-medium">{formatCurrency(parseFloat(v))}</span> },
    {
      key: 'actions', title: 'Thao tác', width: '100px',
      render: (_, row) => (
        <div className="flex gap-1">
          {hasRole('ADMIN') && (
            <>
              <button onClick={e => { e.stopPropagation(); setModal({ open: true, mode: 'edit', data: row }); }} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600"><Edit className="w-4 h-4" /></button>
              <button onClick={e => { e.stopPropagation(); handleDelete(row); }} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
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
          <h1 className="page-header">Sản phẩm</h1>
          <p className="text-sm text-gray-500 mt-1">Danh sách hàng hóa trong hệ thống</p>
        </div>
        {hasRole('ADMIN') && (
          <button onClick={() => setModal({ open: true, mode: 'create', data: null })} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Thêm sản phẩm
          </button>
        )}
      </div>

      <div className="flex gap-3">
        <input className="input-field max-w-xs" placeholder="Tìm kiếm tên, SKU..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="select-field max-w-xs" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">Tất cả danh mục</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <DataTable columns={columns} data={data} loading={loading} emptyMessage="Chưa có sản phẩm nào." />

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false })} title={modal.mode === 'create' ? 'Thêm sản phẩm' : 'Sửa sản phẩm'} size="md">
        <ProductForm categories={categories} initialData={modal.data} onSave={handleSave} onCancel={() => setModal({ open: false })} />
      </Modal>
    </div>
  );
}

function ProductForm({ categories, initialData, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: initialData?.name || '',
    category_id: initialData?.category_id || '',
    unit: initialData?.unit || 'Cái',
    price: initialData?.price || '',
    image_url: initialData?.image_url || '',
  });

  const handleSubmit = () => {
    if (!form.name.trim()) return toast.error('Tên sản phẩm là bắt buộc.');
    const payload = { ...form, category_id: form.category_id || null, price: parseFloat(form.price) || 0 };
    onSave(payload);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="label-field">Tên sản phẩm *</label>
        <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="VD: Gạo ST25 5kg" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-field">Danh mục</label>
          <select className="select-field" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
            <option value="">-- Chọn danh mục --</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label-field">Đơn vị</label>
          <input className="input-field" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="Cái, Bộ, Chai..." />
        </div>
      </div>
      <div>
        <label className="label-field">Giá bán (VND) *</label>
        <input type="number" className="input-field" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} min="0" placeholder="0" />
      </div>
      <div>
        <label className="label-field">URL Hình ảnh</label>
        <input className="input-field" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t">
        <button onClick={onCancel} className="btn-secondary">Hủy</button>
        <button onClick={handleSubmit} className="btn-primary">Lưu</button>
      </div>
    </div>
  );
}
