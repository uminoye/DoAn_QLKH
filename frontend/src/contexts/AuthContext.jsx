import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('wms_token');
    if (token) {
      authApi.getMe()
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('wms_token');
          localStorage.removeItem('wms_user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const res = await authApi.login({ username, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('wms_token', token);
    localStorage.setItem('wms_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('wms_token');
    localStorage.removeItem('wms_user');
    setUser(null);
  };

  const hasRole = (...roles) => user && roles.includes(user.role);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};
