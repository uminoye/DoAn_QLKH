import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...args) => twMerge(clsx(args));

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export const getRoleLabel = (role) => {
  const labels = { ADMIN: 'Quản trị', MANAGER: 'Trưởng phòng', KHO: 'Nhân viên kho', SALES: 'Kinh doanh' };
  return labels[role] || role;
};

export const getStatusBadge = (status) => {
  const map = {
    PENDING: { label: 'Chờ duyệt', className: 'badge-warning' },
    APPROVED: { label: 'Đã duyệt', className: 'badge-success' },
    REJECTED: { label: 'Từ chối', className: 'badge-danger' },
    COMPLETED: { label: 'Hoàn tất', className: 'badge-success' },
    PROCESSING: { label: 'Đang xử lý', className: 'badge-info' },
  };
  const config = map[status] || { label: status, className: 'badge-gray' };
  return config;
};
