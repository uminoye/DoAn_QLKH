import { createContext, useContext, useState, useEffect } from 'react';
import { warehouseApi } from '../api';

const WarehouseContext = createContext(null);

export const useWarehouse = () => {
  const ctx = useContext(WarehouseContext);
  if (!ctx) throw new Error('useWarehouse must be used within WarehouseProvider');
  return ctx;
};

export const WarehouseProvider = ({ children }) => {
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    warehouseApi.getAll()
      .then(res => {
        setWarehouses(res.data);
        const saved = localStorage.getItem('wms_warehouse_id');
        if (saved && res.data.find(w => w.id === parseInt(saved, 10))) {
          setSelectedWarehouseId(parseInt(saved, 10));
        } else if (res.data.length > 0) {
          setSelectedWarehouseId(res.data[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selectWarehouse = (id) => {
    setSelectedWarehouseId(id);
    localStorage.setItem('wms_warehouse_id', id);
  };

  return (
    <WarehouseContext.Provider value={{ warehouses, selectedWarehouseId, selectWarehouse, loading }}>
      {children}
    </WarehouseContext.Provider>
  );
};
