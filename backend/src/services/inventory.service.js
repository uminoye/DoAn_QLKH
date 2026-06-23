const { query } = require('../config/database');
const { AppError } = require('../utils/AppError');

const getPivotReport = async () => {
  const warehouseResult = await query(`
    SELECT id, name FROM warehouses WHERE is_active = true ORDER BY id ASC
  `);

  const warehouses = warehouseResult.rows;
  const productResult = await query(`
    SELECT id, sku, name FROM products ORDER BY name ASC
  `);

  const products = productResult.rows;
  const warehouseIds = warehouses.map(w => w.id);
  const warehouseNames = warehouses.map(w => w.name);

  const pivotResult = await query(`
    SELECT
      p.id,
      p.sku,
      p.name,
      ${warehouseIds.map((wid, i) =>
        `COALESCE(SUM(i${i}.quantity), 0) as "warehouse_${wid}"`).join(',\n')}
    FROM products p
    LEFT JOIN inventory i1 ON p.id = i1.product_id
    ${warehouseIds.slice(1).map((_, i) =>
      `LEFT JOIN inventory i${i+1} ON p.id = i${i+1}.product_id AND i${i+1}.warehouse_id = ${warehouseIds[i+1]}`).join('\n')}
    GROUP BY p.id, p.sku, p.name
    ORDER BY p.name
  `);

  return {
    warehouses: warehouseNames,
    columns: ['sku', 'name', ...warehouseIds.map(id => `warehouse_${id}`), 'total'],
    rows: pivotResult.rows.map(row => {
      const total = warehouseIds.reduce((sum, wid) => sum + parseInt(row[`warehouse_${wid}`] || 0, 10), 0);
      return { ...row, total };
    }),
  };
};

const getByWarehouse = async (warehouse_id) => {
  if (!warehouse_id) throw new AppError('warehouse_id là bắt buộc.', 400);

  const result = await query(`
    SELECT
      i.id,
      i.product_id,
      p.sku,
      p.name as product_name,
      p.unit,
      i.warehouse_id,
      w.name as warehouse_name,
      i.location_id,
      l.bin_code,
      i.quantity
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    JOIN warehouses w ON i.warehouse_id = w.id
    LEFT JOIN locations l ON i.location_id = l.id
    WHERE i.warehouse_id = $1 AND i.quantity > 0
    ORDER BY p.name
  `, [warehouse_id]);

  return result.rows;
};

const getStockByProduct = async (productId) => {
  const result = await query(`
    SELECT
      i.warehouse_id,
      w.name as warehouse_name,
      COALESCE(SUM(i.quantity), 0) as total_quantity
    FROM inventory i
    JOIN warehouses w ON i.warehouse_id = w.id
    WHERE i.product_id = $1 AND i.quantity > 0
    GROUP BY i.warehouse_id, w.name
  `, [productId]);

  const grandTotal = result.rows.reduce((sum, r) => sum + parseInt(r.total_quantity, 10), 0);

  return {
    product_id: productId,
    total_stock: grandTotal,
    by_warehouse: result.rows,
  };
};

const traceProduct = async (productId) => {
  const result = await query(`
    SELECT
      l.id as location_id,
      l.bin_code,
      l.zone,
      i.warehouse_id,
      w.name as warehouse_name,
      i.quantity,
      it.quantity_change,
      it.created_at
    FROM inventory i
    JOIN locations l ON i.location_id = l.id
    JOIN warehouses w ON i.warehouse_id = w.id
    LEFT JOIN inventory_transactions it ON it.product_id = i.product_id
      AND it.location_id = i.location_id AND it.warehouse_id = i.warehouse_id
    WHERE i.product_id = $1 AND i.quantity > 0
    ORDER BY it.created_at ASC NULLS LAST
  `, [productId]);

  return result.rows;
};

module.exports = { getPivotReport, getByWarehouse, getStockByProduct, traceProduct };
