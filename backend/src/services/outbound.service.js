const { query, transaction } = require('../config/database');
const { AppError } = require('../utils/AppError');
const { getNextCode } = require('../utils/codeGenerator');

const getAll = async (queryParams) => {
  const { warehouse_id, status } = queryParams;
  const result = await query(`
    SELECT
      oo.id, oo.outbound_code, oo.warehouse_id, oo.notes, oo.status,
      oo.created_by, oo.approved_by, oo.completed_at,
      w.name as warehouse_name,
      u1.full_name as created_by_name,
      u2.full_name as approved_by_name,
      oo.created_at, oo.updated_at,
      (
        SELECT json_agg(json_build_object(
          'id', o.id,
          'product_id', o.product_id,
          'requested_quantity', o.requested_quantity,
          'picked_quantity', o.picked_quantity,
          'picked_location_id', o.picked_location_id,
          'product_name', p.name,
          'product_sku', p.sku,
          'bin_code', l.bin_code
        ))
        FROM outbound_order_items o
        LEFT JOIN products p ON o.product_id = p.id
        LEFT JOIN locations l ON o.picked_location_id = l.id
        WHERE o.outbound_order_id = oo.id
      ) as items
    FROM outbound_orders oo
    JOIN warehouses w ON oo.warehouse_id = w.id
    LEFT JOIN users u1 ON oo.created_by = u1.id
    LEFT JOIN users u2 ON oo.approved_by = u2.id
    WHERE ($1::int IS NULL OR oo.warehouse_id = $1)
      AND ($2::varchar IS NULL OR oo.status = $2)
    ORDER BY oo.created_at DESC
  `, [warehouse_id || null, status || null]);

  return result.rows;
};

const getById = async (id) => {
  const result = await query(`
    SELECT oo.*, w.name as warehouse_name,
      u1.full_name as created_by_name, u2.full_name as approved_by_name
    FROM outbound_orders oo
    JOIN warehouses w ON oo.warehouse_id = w.id
    LEFT JOIN users u1 ON oo.created_by = u1.id
    LEFT JOIN users u2 ON oo.approved_by = u2.id
    WHERE oo.id = $1
  `, [id]);

  if (!result.rows.length) throw new AppError('Phiếu xuất không tồn tại.', 404);

  const itemsResult = await query(`
    SELECT oi.*, p.name as product_name, p.sku as product_sku,
      l.bin_code, l.zone
    FROM outbound_order_items oi
    JOIN products p ON oi.product_id = p.id
    LEFT JOIN locations l ON oi.picked_location_id = l.id
    WHERE oi.outbound_order_id = $1
  `, [id]);

  return { ...result.rows[0], items: itemsResult.rows };
};

const create = async (data, userId) => {
  const { warehouse_id, notes, items } = data;

  if (!warehouse_id) throw new AppError('warehouse_id là bắt buộc.', 400);
  if (!items || items.length === 0) throw new AppError('Danh sách sản phẩm không được trống.', 400);

  for (const item of items) {
    if (!item.product_id || !item.requested_quantity || item.requested_quantity <= 0) {
      throw new AppError('Mỗi sản phẩm cần có product_id và requested_quantity > 0.', 400);
    }
  }

  const t = await transaction();

  try {
    const outboundCode = await getNextCode('OTB', 'seq_outbound');

    const orderResult = await t.query(
      `INSERT INTO outbound_orders (outbound_code, warehouse_id, notes, status, created_by)
       VALUES ($1, $2, $3, 'PENDING', $4)
       RETURNING id, outbound_code`,
      [outboundCode, warehouse_id, notes || null, userId]
    );
    const orderId = orderResult.rows[0].id;

    for (const item of items) {
      await t.query(
        `INSERT INTO outbound_order_items (outbound_order_id, product_id, requested_quantity)
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
  if (!order) throw new AppError('Phiếu xuất không tồn tại.', 404);
  if (order.status !== 'PENDING') throw new AppError('Chỉ duyệt phiếu đang chờ.', 400);

  await query(
    `UPDATE outbound_orders SET status = 'APPROVED', approved_by = $1, updated_at = NOW() WHERE id = $2`,
    [userId, id]
  );

  return getById(id);
};

const complete = async (id, userId) => {
  const order = await getById(id);
  if (!order) throw new AppError('Phiếu xuất không tồn tại.', 404);
  if (order.status !== 'APPROVED') throw new AppError('Chỉ hoàn tất phiếu đã duyệt.', 400);

  const t = await transaction();

  try {
    for (const item of order.items) {
      let remaining = item.requested_quantity;

      const binsResult = await t.query(`
        SELECT i.id as inv_id, i.location_id, i.quantity as available_qty,
          l.bin_code, l.zone
        FROM inventory i
        JOIN locations l ON i.location_id = l.id
        WHERE i.product_id = $1 AND i.warehouse_id = $2 AND i.quantity > 0
        ORDER BY i.updated_at ASC
        FOR UPDATE
      `, [item.product_id, order.warehouse_id]);

      if (binsResult.rows.length === 0) {
        throw new AppError(`Sản phẩm ${item.product_name || item.product_id} không có trong kho.`, 400);
      }

      const totalAvailable = binsResult.rows.reduce((s, r) => s + parseInt(r.available_qty, 10), 0);
      if (totalAvailable < remaining) {
        throw new AppError(
          `Sản phẩm ${item.product_name || item.product_id}: chỉ còn ${totalAvailable}, cần ${remaining}.`,
          400
        );
      }

      for (const bin of binsResult.rows) {
        if (remaining <= 0) break;

        const pickFromBin = Math.min(remaining, parseInt(bin.available_qty, 10));

        await t.query(
          `UPDATE inventory SET quantity = quantity - $1, updated_at = NOW()
           WHERE id = $2`,
          [pickFromBin, bin.inv_id]
        );

        if (parseInt(bin.available_qty, 10) - pickFromBin === 0) {
          await t.query(
            `UPDATE locations SET status = 'EMPTY', product_id = NULL WHERE id = $1`,
            [bin.location_id]
          );
        }

        const lastQtyResult = await t.query(
          `SELECT COALESCE(MAX(quantity_after), 0) as last_qty FROM inventory_transactions
           WHERE product_id = $1 AND warehouse_id = $2 AND location_id = $3`,
          [item.product_id, order.warehouse_id, bin.location_id]
        );

        await t.query(
          `INSERT INTO inventory_transactions
           (product_id, warehouse_id, location_id, transaction_type, reference_type, reference_id, quantity_change, quantity_after, user_id)
           VALUES ($1, $2, $3, 'OUTBOUND', 'outbound_order', $4, $5, $6, $7)`,
          [
            item.product_id, order.warehouse_id, bin.location_id, id,
            -pickFromBin,
            parseInt(lastQtyResult.rows[0].last_qty, 10) - pickFromBin,
            userId
          ]
        );

        await t.query(
          `UPDATE outbound_order_items SET picked_quantity = picked_quantity + $1, picked_location_id = $2 WHERE id = $3`,
          [pickFromBin, bin.location_id, item.id]
        );

        remaining -= pickFromBin;
      }
    }

    await t.query(
      `UPDATE outbound_orders SET status = 'COMPLETED', completed_at = NOW(), updated_at = NOW() WHERE id = $1`,
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
  if (!order) throw new AppError('Phiếu xuất không tồn tại.', 404);
  if (order.status !== 'PENDING') throw new AppError('Chỉ từ chối phiếu đang chờ.', 400);

  await query(
    `UPDATE outbound_orders SET status = 'REJECTED', approved_by = $1, updated_at = NOW() WHERE id = $2`,
    [userId, id]
  );

  return getById(id);
};

module.exports = { getAll, getById, create, approve, complete, reject };
