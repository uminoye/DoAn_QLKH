import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { WarehouseProvider } from './contexts/WarehouseContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <WarehouseProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              style: { fontFamily: 'inherit', fontSize: '14px' },
            }}
          />
        </WarehouseProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
