import { useState, useEffect } from 'react';
import { userApi } from '../api';
import DataTable from '../components/DataTable';
import { toast } from 'sonner';
import { Edit, Trash2, UserCheck } from 'lucide-react';
import { getRoleLabel } from '../utils/helpers';

const ROLE_COLORS = {
  ADMIN: 'bg-red-100 text-red-800',
  MANAGER: 'bg-blue-100 text-blue-800',
  KHO: 'bg-green-100 text-green-800',
  SALES: 'bg-purple-100 text-purple-800',
};

export default function UsersPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    userApi.getAll().then(r => setData(r.data)).catch(() => toast.error('Lỗi tải người dùng')).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const columns = [
    { key: 'username', title: 'Tài khoản', render: v => <span className="font-medium text-gray-900">{v}</span> },
    { key: 'full_name', title: 'Họ tên' },
    { key: 'email', title: 'Email' },
    {
      key: 'role', title: 'Vai trò',
      render: v => <span className={`badge ${ROLE_COLORS[v] || 'bg-gray-100 text-gray-800'}`}>{getRoleLabel(v)}</span>
    },
    { key: 'is_active', title: 'Trạng thái', render: v => v ? <span className="badge-success">Hoạt động</span> : <span className="badge-danger">Tắt</span> },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-header">Quản lý Người dùng</h1>
        <p className="text-sm text-gray-500 mt-1">Phân quyền truy cập hệ thống (RBAC)</p>
      </div>
      <DataTable columns={columns} data={data} loading={loading} emptyMessage="Chưa có người dùng nào." />
    </div>
  );
}
