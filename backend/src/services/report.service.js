const { query } = require('../config/database');

const getInventorySummary = async () => {
  const result = await query(`
    SELECT
      w.id as warehouse_id, w.name as warehouse_name,
      COUNT(DISTINCT l.id) as total_bins,
      COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'FULL') as used_bins,
      COUNT(DISTINCT p.id) as unique_products,
      COALESCE(SUM(i.quantity), 0) as total_quantity
    FROM warehouses w
    LEFT JOIN locations l ON l.warehouse_id = w.id
    LEFT JOIN inventory i ON i.warehouse_id = w.id
    LEFT JOIN products p ON p.id = i.product_id AND i.quantity > 0
    WHERE w.is_active = true
    GROUP BY w.id, w.name
    ORDER BY w.id
  `);
  return result.rows;
};

const getInboundSummary = async (queryParams) => {
  const { from_date, to_date } = queryParams;
  const result = await query(`
    SELECT
      w.name as warehouse_name,
      COUNT(io.id) as total_orders,
      COUNT(io.id) FILTER (WHERE io.status = 'APPROVED') as approved,
      COUNT(io.id) FILTER (WHERE io.status = 'PENDING') as pending,
      COUNT(io.id) FILTER (WHERE io.status = 'REJECTED') as rejected,
      (
        SELECT COALESCE(SUM(i.requested_quantity), 0)
        FROM inbound_order_items i
        JOIN inbound_orders io2 ON i.inbound_order_id = io2.id
        WHERE io2.warehouse_id = w.id
          AND io2.status = 'APPROVED'
          AND ($1::date IS NULL OR io2.created_at >= $1)
          AND ($2::date IS NULL OR io2.created_at <= $2)
      ) as total_items_received
    FROM warehouses w
    WHERE w.is_active = true
    GROUP BY w.id, w.name
    ORDER BY w.id
  `, [from_date || null, to_date || null]);
  return result.rows;
};

const getOutboundSummary = async (queryParams) => {
  const { from_date, to_date } = queryParams;
  const result = await query(`
    SELECT
      w.name as warehouse_name,
      COUNT(oo.id) as total_orders,
      COUNT(oo.id) FILTER (WHERE oo.status = 'COMPLETED') as completed,
      COUNT(oo.id) FILTER (WHERE oo.status = 'PENDING') as pending,
      COUNT(oo.id) FILTER (WHERE oo.status = 'APPROVED') as approved,
      COUNT(oo.id) FILTER (WHERE oo.status = 'REJECTED') as rejected,
      (
        SELECT COALESCE(SUM(oi.requested_quantity), 0)
        FROM outbound_order_items oi
        JOIN outbound_orders oo2 ON oi.outbound_order_id = oo2.id
        WHERE oo2.warehouse_id = w.id
          AND oo2.status = 'COMPLETED'
          AND ($1::date IS NULL OR oo2.created_at >= $1)
          AND ($2::date IS NULL OR oo2.created_at <= $2)
      ) as total_items_shipped
    FROM warehouses w
    WHERE w.is_active = true
    GROUP BY w.id, w.name
    ORDER BY w.id
  `, [from_date || null, to_date || null]);
  return result.rows;
};

const getSalesSummary = async (queryParams) => {
  const { from_date, to_date } = queryParams;
  const result = await query(`
    SELECT
      DATE_TRUNC('month', so.created_at) as month,
      COUNT(so.id) as total_orders,
      COUNT(so.id) FILTER (WHERE so.status = 'COMPLETED') as completed,
      COUNT(so.id) FILTER (WHERE so.status = 'PENDING') as pending,
      COALESCE(SUM(so.total_amount) FILTER (WHERE so.status = 'COMPLETED'), 0) as total_revenue
    FROM sales_orders so
    WHERE ($1::date IS NULL OR so.created_at >= $1)
      AND ($2::date IS NULL OR so.created_at <= $2)
    GROUP BY DATE_TRUNC('month', so.created_at)
    ORDER BY month DESC
    LIMIT 12
  `, [from_date || null, to_date || null]);
  return result.rows;
};

const getDashboardStats = async () => {
  const [warehouses, inventory, inbound, outbound, sales, products, customers] = await Promise.all([
    query(`SELECT COUNT(*) as count FROM warehouses WHERE is_active = true`),
    query(`SELECT COALESCE(SUM(quantity), 0) as total FROM inventory`),
    query(`SELECT COUNT(*) as count FROM inbound_orders WHERE status = 'PENDING'`),
    query(`SELECT COUNT(*) as count FROM outbound_orders WHERE status = 'PENDING'`),
    query(`SELECT COUNT(*) as count FROM sales_orders WHERE status = 'PENDING'`),
    query(`SELECT COUNT(*) as count FROM products`),
    query(`SELECT COUNT(*) as count FROM customers`),
  ]);

  return {
    total_warehouses: parseInt(warehouses.rows[0].count, 10),
    total_inventory: parseInt(inventory.rows[0].total, 10),
    pending_inbound: parseInt(inbound.rows[0].count, 10),
    pending_outbound: parseInt(outbound.rows[0].count, 10),
    pending_sales: parseInt(sales.rows[0].count, 10),
    total_products: parseInt(products.rows[0].count, 10),
    total_customers: parseInt(customers.rows[0].count, 10),
  };
};

module.exports = {
  getInventorySummary,
  getInboundSummary,
  getOutboundSummary,
  getSalesSummary,
  getDashboardStats,
};
