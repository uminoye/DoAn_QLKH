const { query, transaction } = require('../config/database');
const { AppError } = require('../utils/AppError');
const { getNextCode } = require('../utils/codeGenerator');

const getAll = async (queryParams) => {
  const { warehouse_id, status, customer_id } = queryParams;
  const result = await query(`
    SELECT
      so.id, so.sales_order_code, so.customer_id, so.warehouse_id,
      so.total_amount, so.status, so.created_by, so.approved_by,
      c.name as customer_name, c.customer_code,
      w.name as warehouse_name,
      u1.full_name as created_by_name,
      u2.full_name as approved_by_name,
      so.created_at, so.updated_at,
      (
        SELECT json_agg(json_build_object(
          'id', si.id, 'product_id', si.product_id,
          'quantity', si.quantity, 'unit_price', si.unit_price,
          'product_name', p.name, 'product_sku', p.sku,
          'line_total', (si.quantity * si.unit_price)
        ))
        FROM sales_order_items si
        JOIN products p ON si.product_id = p.id
        WHERE si.sales_order_id = so.id
      ) as items
    FROM sales_orders so
    LEFT JOIN customers c ON so.customer_id = c.id
    LEFT JOIN warehouses w ON so.warehouse_id = w.id
    LEFT JOIN users u1 ON so.created_by = u1.id
    LEFT JOIN users u2 ON so.approved_by = u2.id
    WHERE ($1::int IS NULL OR so.warehouse_id = $1)
      AND ($2::varchar IS NULL OR so.status = $2)
      AND ($3::int IS NULL OR so.customer_id = $3)
    ORDER BY so.created_at DESC
  `, [warehouse_id || null, status || null, customer_id || null]);

  return result.rows;
};

const getById = async (id) => {
  const result = await query(`
    SELECT so.*, c.name as customer_name, c.customer_code,
      w.name as warehouse_name,
      u1.full_name as created_by_name, u2.full_name as approved_by_name
    FROM sales_orders so
    LEFT JOIN customers c ON so.customer_id = c.id
    LEFT JOIN warehouses w ON so.warehouse_id = w.id
    LEFT JOIN users u1 ON so.created_by = u1.id
    LEFT JOIN users u2 ON so.approved_by = u2.id
    WHERE so.id = $1
  `, [id]);

  if (!result.rows.length) throw new AppError('Đơn hàng không tồn tại.', 404);

  const itemsResult = await query(`
    SELECT si.*, p.name as product_name, p.sku as product_sku, p.unit
    FROM sales_order_items si
    JOIN products p ON si.product_id = p.id
    WHERE si.sales_order_id = $1
  `, [id]);

  return { ...result.rows[0], items: itemsResult.rows };
};

const create = async (data, userId) => {
  const { customer_id, warehouse_id, notes, items } = data;

  if (!warehouse_id) throw new AppError('warehouse_id là bắt buộc.', 400);
  if (!items || items.length === 0) throw new AppError('Danh sách sản phẩm không được trống.', 400);

  const t = await transaction();

  try {
    const soCode = await getNextCode('SO', 'seq_sales_order');
    let totalAmount = 0;

    for (const item of items) {
      const priceResult = await t.query(`SELECT price FROM products WHERE id = $1`, [item.product_id]);
      if (!priceResult.rows.length) throw new AppError(`Sản phẩm ID ${item.product_id} không tồn tại.`, 400);
      totalAmount += parseFloat(priceResult.rows[0].price) * item.quantity;
    }

    const orderResult = await t.query(
      `INSERT INTO sales_orders (sales_order_code, customer_id, warehouse_id, notes, total_amount, status, created_by)
       VALUES ($1, $2, $3, $4, $5, 'PENDING', $6)
       RETURNING id, sales_order_code`,
      [soCode, customer_id || null, warehouse_id, notes || null, totalAmount, userId]
    );
    const orderId = orderResult.rows[0].id;

    for (const item of items) {
      const priceResult = await t.query(`SELECT price FROM products WHERE id = $1`, [item.product_id]);
      const unitPrice = parseFloat(priceResult.rows[0].price);
      await t.query(
        `INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.product_id, item.quantity, unitPrice]
      );
    }

    await t.commit();
    return getById(orderId);
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

const approve = async (id, userId) => {
  const order = await getById(id);
  if (!order) throw new AppError('Đơn hàng không tồn tại.', 404);
  if (order.status !== 'PENDING') throw new AppError('Chỉ duyệt đơn hàng đang chờ.', 400);

  const t = await transaction();

  try {
    for (const item of order.items) {
      const stockResult = await t.query(`
        SELECT COALESCE(SUM(quantity), 0) as total FROM inventory
        WHERE product_id = $1 AND warehouse_id = $2
      `, [item.product_id, order.warehouse_id]);

      if (parseInt(stockResult.rows[0].total, 10) < item.quantity) {
        throw new AppError(
          `Sản phẩm ${item.product_name || item.product_id}: tồn kho ${stockResult.rows[0].total}, cần ${item.quantity}.`,
          400
        );
      }
    }

    await t.query(
      `UPDATE sales_orders SET status = 'APPROVED', approved_by = $1, updated_at = NOW() WHERE id = $2`,
      [userId, id]
    );

    const outboundCode = await getNextCode('OTB', 'seq_outbound');
    const outboundResult = await t.query(
      `INSERT INTO outbound_orders (outbound_code, warehouse_id, notes, status, created_by)
       VALUES ($1, $2, $3, 'PENDING', $4)
       RETURNING id`,
      [outboundCode, order.warehouse_id, `Tự động tạo từ SO: ${order.sales_order_code}`, userId]
    );
    const outboundId = outboundResult.rows[0].id;

    for (const item of order.items) {
      await t.query(
        `INSERT INTO outbound_order_items (outbound_order_id, product_id, requested_quantity)
         VALUES ($1, $2, $3)`,
        [outboundId, item.product_id, item.quantity]
      );
    }

    await t.query(
      `UPDATE sales_orders SET status = 'PROCESSING', updated_at = NOW() WHERE id = $1`,
      [id]
    );

    await t.commit();
    return getById(id);
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

const reject = async (id, userId) => {
  const order = await getById(id);
  if (!order) throw new AppError('Đơn hàng không tồn tại.', 404);
  if (order.status !== 'PENDING') throw new AppError('Chỉ từ chối đơn hàng đang chờ.', 400);

  await query(
    `UPDATE sales_orders SET status = 'REJECTED', approved_by = $1, updated_at = NOW() WHERE id = $2`,
    [userId, id]
  );

  return getById(id);
};

const checkStock = async (items, warehouse_id) => {
  if (!warehouse_id) throw new AppError('warehouse_id là bắt buộc.', 400);

  const results = [];
  for (const item of items) {
    const stockResult = await query(`
      SELECT COALESCE(SUM(i.quantity), 0) as total
      FROM inventory i
      WHERE i.product_id = $1 AND i.warehouse_id = $2
    `, [item.product_id, warehouse_id]);

    const productResult = await query(`SELECT name, sku, unit, price FROM products WHERE id = $1`, [item.product_id]);

    if (productResult.rows.length) {
      results.push({
        product_id: item.product_id,
        product_name: productResult.rows[0].name,
        sku: productResult.rows[0].sku,
        unit: productResult.rows[0].unit,
        price: parseFloat(productResult.rows[0].price),
        requested: item.quantity,
        available: parseInt(stockResult.rows[0].total, 10),
        sufficient: parseInt(stockResult.rows[0].total, 10) >= item.quantity,
      });
    }
  }

  return results;
};

module.exports = { getAll, getById, create, approve, reject, checkStock };
