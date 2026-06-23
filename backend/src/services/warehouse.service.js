const { query } = require('../config/database');
const { Warehouse } = require('../models');
const { AppError } = require('../utils/AppError');

const ZONES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

function generateBinCodes(totalCapacity) {
  const bins = [];
  let count = 0;
  for (let z = 0; z < ZONES.length && count < totalCapacity; z++) {
    for (let a = 1; a <= 9 && count < totalCapacity; a++) {
      for (let r = 1; r <= 9 && count < totalCapacity; r++) {
        for (let s = 1; s <= 9 && count < totalCapacity; s++) {
          for (let b = 1; b <= 9 && count < totalCapacity; b++) {
            bins.push({
              bin_code: `${ZONES[z]}-A${a}-R${r}-S${s}-B${b}`,
              zone: ZONES[z],
              aisle: `A${a}`,
              rack: `R${r}`,
              shelf: `S${s}`,
              bin: `B${b}`,
            });
            count++;
          }
        }
      }
    }
  }
  return bins;
}

const getAll = async () => {
  const warehouses = await Warehouse.findAll({
    where: { is_active: true },
    order: [['id', 'ASC']],
  });

  const result = await Promise.all(
    warehouses.map(async (w) => {
      const usedResult = await query(
        `SELECT COUNT(*) as used FROM locations WHERE warehouse_id = $1 AND status = 'FULL'`,
        [w.id]
      );
      const totalResult = await query(
        `SELECT COUNT(*) as total FROM locations WHERE warehouse_id = $1`,
        [w.id]
      );
      const used = parseInt(usedResult.rows[0].used, 10);
      const total = parseInt(totalResult.rows[0].total, 10);
      return {
        ...w.toJSON(),
        bins_used: used,
        bins_total: total,
        capacity_percent: total > 0 ? Math.round((used / total) * 100) : 0,
      };
    })
  );

  return result;
};

const getById = async (id) => {
  const warehouse = await Warehouse.findByPk(id);
  if (!warehouse) throw new AppError('Kho không tồn tại.', 404);

  const statsResult = await query(`
    SELECT
      COUNT(*) FILTER (WHERE status = 'FULL') as used,
      COUNT(*) as total
    FROM locations WHERE warehouse_id = $1
  `, [id]);

  const used = parseInt(statsResult.rows[0].used, 10);
  const total = parseInt(statsResult.rows[0].total, 10);

  return {
    ...warehouse.toJSON(),
    bins_used: used,
    bins_total: total,
    capacity_percent: total > 0 ? Math.round((used / total) * 100) : 0,
  };
};

const create = async (data) => {
  const t = await require('../config/database').transaction();

  try {
    const warehouse = await Warehouse.create(data, { transaction: t });

    if (data.total_capacity > 0) {
      const bins = generateBinCodes(data.total_capacity);
      const locationInserts = bins.map(b => [
        warehouse.id, b.bin_code, b.zone, b.aisle, b.rack, b.shelf, b.bin,
      ]);

      for (const row of locationInserts) {
        await t.query(
          `INSERT INTO locations (warehouse_id, bin_code, zone, aisle, rack, shelf, bin, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'EMPTY')`,
          row
        );
      }
    }

    await t.commit();
    return getById(warehouse.id);
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

const updateById = async (id, data) => {
  const warehouse = await Warehouse.findByPk(id);
  if (!warehouse) throw new AppError('Kho không tồn tại.', 404);
  await warehouse.update(data);
  return getById(id);
};

const deleteById = async (id) => {
  const warehouse = await Warehouse.findByPk(id);
  if (!warehouse) throw new AppError('Kho không tồn tại.', 404);

  const hasStock = await query(
    `SELECT 1 FROM locations WHERE warehouse_id = $1 AND status = 'FULL' LIMIT 1`,
    [id]
  );
  if (hasStock.rows.length > 0) {
    throw new AppError('Không thể xóa kho đang có hàng tồn.', 400);
  }

  await warehouse.update({ is_active: false });
};

module.exports = { getAll, getById, create, updateById, deleteById };
