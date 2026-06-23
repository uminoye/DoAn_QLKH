const { query, transaction } = require('../config/database');
const { AppError } = require('../utils/AppError');
const { getNextCode } = require('../utils/codeGenerator');

const getAll = async (queryParams) => {
  const { warehouse_id, status, search } = queryParams;
  const where = {};
  if (warehouse_id) where.warehouse_id = parseInt(warehouse_id, 10);
  if (status) where.status = status;

  const result = await query(`
    SELECT
      io.id, io.inbound_code, io.warehouse_id, io.notes, io.status,
      io.created_by, io.approved_by,
      w.name as warehouse_name,
      u1.full_name as created_by_name,
      u2.full_name as approved_by_name,
      io.created_at, io.updated_at,
      (
        SELECT json_agg(json_build_object(
          'id', i.id,
          'product_id', i.product_id,
          'requested_quantity', i.requested_quantity,
          'assigned_location_id', i.assigned_location_id,
          'product_name', p.name,
          'product_sku', p.sku,
          'bin_code', l.bin_code
        ))
        FROM inbound_order_items i
        LEFT JOIN products p ON i.product_id = p.id
        LEFT JOIN locations l ON i.assigned_location_id = l.id
        WHERE i.inbound_order_id = io.id
      ) as items
    FROM inbound_orders io
    JOIN warehouses w ON io.warehouse_id = w.id
    LEFT JOIN users u1 ON io.created_by = u1.id
    LEFT JOIN users u2 ON io.approved_by = u2.id
    WHERE ($1::int IS NULL OR io.warehouse_id = $1)
      AND ($2::varchar IS NULL OR io.status = $2)
    ORDER BY io.created_at DESC
  `, [warehouse_id || null, status || null]);

  return result.rows;
};

const getById = async (id) => {
  const result = await query(`
    SELECT
      io.*, w.name as warehouse_name,
      u1.full_name as created_by_name,
      u2.full_name as approved_by_name
    FROM inbound_orders io
    JOIN warehouses w ON io.warehouse_id = w.id
    LEFT JOIN users u1 ON io.created_by = u1.id
    LEFT JOIN users u2 ON io.approved_by = u2.id
    WHERE io.id = $1
  `, [id]);

  if (!result.rows.length) throw new AppError('Phiếu nhập không tồn tại.', 404);

  const itemsResult = await query(`
    SELECT i.*, p.name as product_name, p.sku as product_sku, l.bin_code
    FROM inbound_order_items i
    JOIN products p ON i.product_id = p.id
    LEFT JOIN locations l ON i.assigned_location_id = l.id
    WHERE i.inbound_order_id = $1
  `, [id]);

  return { ...result.rows[0], items: itemsResult.rows };
};

const create = async (data, userId) => {
  const { warehouse_id, notes, items } = data;

  if (!warehouse_id) throw new AppError('warehouse_id là bắt buộc.', 400);
  if (!items || items.length === 0) throw new AppError('Danh sách sản phẩm không được trống.', 400);

  const t = await transaction();

  try {
    const inboundCode = await getNextCode('INB', 'seq_inbound');

    const orderResult = await t.query(
      `INSERT INTO inbound_orders (inbound_code, warehouse_id, notes, status, created_by)
       VALUES ($1, $2, $3, 'PENDING', $4)
       RETURNING id, inbound_code`,
      [inboundCode, warehouse_id, notes || null, userId]
    );
    const orderId = orderResult.rows[0].id;

    for (const item of items) {
      if (!item.product_id || !item.requested_quantity || item.requested_quantity <= 0) {
        throw new AppError('Mỗi sản phẩm cần có product_id và requested_quantity > 0.', 400);
      }

      await t.query(
        `INSERT INTO inbound_order_items (inbound_order_id, product_id, requested_quantity)
         VALUES ($1, $2, $3)`,
        [orderId, item.product_id, item.requested_quantity]
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
  if (!order) throw new AppError('Phiếu nhập không tồn tại.', 404);
  if (order.status !== 'PENDING') throw new AppError('Chỉ duyệt phiếu đang chờ.', 400);

  const t = await transaction();

  try {
    const emptyLocations = await Location.findAll({
      where: { warehouse_id: order.warehouse_id, status: 'EMPTY' },
      order: [['zone', 'ASC'], ['aisle', 'ASC'], ['rack', 'ASC'], ['shelf', 'ASC'], ['bin', 'ASC']],
      transaction: t,
    });

    if (emptyLocations.length === 0) {
      throw new AppError('Kho không còn vị trí trống nào.', 400);
    }

    let locationIndex = 0;

    for (const item of order.items) {
      const suggestedLocations = [];
      let remaining = item.requested_quantity;

      while (remaining > 0 && locationIndex < emptyLocations.length) {
        const loc = emptyLocations[locationIndex];
        suggestedLocations.push({ location_id: loc.id, bin_code: loc.bin_code, qty: 1 });
        locationIndex++;
        remaining--;
      }

      if (remaining > 0) {
        throw new AppError(`Không đủ kệ trống cho sản phẩm ${item.product_name || item.product_id}.`, 400);
      }

      for (const sugg of suggestedLocations) {
        await t.query(
          `INSERT INTO inventory (product_id, warehouse_id, location_id, quantity)
           VALUES ($1, $2, $3, 1)
           ON CONFLICT (product_id, warehouse_id, location_id)
           DO UPDATE SET quantity = inventory.quantity + 1, updated_at = NOW()`,
          [item.product_id, order.warehouse_id, sugg.location_id]
        );

        await t.query(
          `UPDATE locations SET status = 'FULL', product_id = $1 WHERE id = $2`,
          [item.product_id, sugg.location_id]
        );

        const invResult = await t.query(
          `SELECT COALESCE(MAX(quantity_after), 0) + 1 as next_qty FROM inventory_transactions
           WHERE product_id = $1 AND warehouse_id = $2 AND location_id = $3`,
          [item.product_id, order.warehouse_id, sugg.location_id]
        );

        await t.query(
          `INSERT INTO inventory_transactions
           (product_id, warehouse_id, location_id, transaction_type, reference_type, reference_id, quantity_change, quantity_after, user_id)
           VALUES ($1, $2, $3, 'INBOUND', 'inbound_order', $4, 1, $5, $6)`,
          [item.product_id, order.warehouse_id, sugg.location_id, id, invResult.rows[0].next_qty, userId]
        );

        await t.query(
          `UPDATE inbound_order_items SET assigned_location_id = $1 WHERE id = $2`,
          [sugg.location_id, item.id]
        );
      }
    }

    await t.query(
      `UPDATE inbound_orders SET status = 'APPROVED', approved_by = $1, updated_at = NOW() WHERE id = $2`,
      [userId, id]
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
  if (!order) throw new AppError('Phiếu nhập không tồn tại.', 404);
  if (order.status !== 'PENDING') throw new AppError('Chỉ từ chối phiếu đang chờ.', 400);

  await query(
    `UPDATE inbound_orders SET status = 'REJECTED', approved_by = $1, updated_at = NOW() WHERE id = $2`,
    [userId, id]
  );

  return getById(id);
};

const suggestBins = async (warehouse_id, product_id, qty) => {
  if (!warehouse_id) throw new AppError('warehouse_id là bắt buộc.', 400);

  const result = await query(`
    SELECT id, bin_code, zone, aisle, rack, shelf, bin
    FROM locations
    WHERE warehouse_id = $1 AND status = 'EMPTY'
    ORDER BY zone ASC, aisle ASC, rack ASC, shelf ASC, bin ASC
    LIMIT $2
  `, [warehouse_id, qty || 50]);

  return {
    warehouse_id,
    total_empty: result.rowCount,
    suggestions: result.rows.map((l, i) => ({
      priority: i < 5 ? 'HIGH' : 'NORMAL',
      ...l,
    })),
  };
};

module.exports = { getAll, getById, create, approve, reject, suggestBins };
