import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Warehouse, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('Vui lòng nhập tên đăng nhập và mật khẩu.');
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password);
      toast.success('Đăng nhập thành công!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <Warehouse className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">WMS Hệ thống Kho</h1>
          <p className="text-gray-500 mt-1 text-sm">Quản lý kho đa chi nhánh</p>
        </div>

        <div className="card p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Đăng nhập</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-field">Tên đăng nhập</label>
              <input
                type="text"
                className="input-field"
                placeholder="Nhập tên đăng nhập"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div>
              <label className="label-field">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Đang xử lý...
                </>
              ) : 'Đăng nhập'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs text-gray-600 space-y-1">
            <div className="font-medium text-gray-700 mb-2">Tài khoản demo (mật khẩu: 123456):</div>
            <div>Admin: <code className="bg-gray-200 px-1 rounded">admin</code></div>
            <div>Manager: <code className="bg-gray-200 px-1 rounded">manager</code></div>
            <div>Kho: <code className="bg-gray-200 px-1 rounded">kho</code></div>
            <div>Sales: <code className="bg-gray-200 px-1 rounded">sales</code></div>
          </div>
        </div>
      </div>
    </div>
  );
}
