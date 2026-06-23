const { Location, Warehouse, Product } = require('../models');
const { AppError } = require('../utils/AppError');

const getAll = async (queryParams) => {
  const { warehouse_id, status, search } = queryParams;
  const where = {};
  if (warehouse_id) where.warehouse_id = parseInt(warehouse_id, 10);
  if (status) where.status = status;
  if (search) {
    const { Op } = require('sequelize');
    where.bin_code = { [Op.iLike]: `%${search}%` };
  }
  return Location.findAll({
    where,
    include: [
      { model: Warehouse, as: 'Warehouse', attributes: ['id', 'name'] },
      { model: Product, as: 'Product', attributes: ['id', 'sku', 'name'] },
    ],
    order: [['bin_code', 'ASC']],
  });
};

const getSuggest = async (warehouse_id, product_id, qty) => {
  if (!warehouse_id) throw new AppError('warehouse_id là bắt buộc.', 400);

  const emptyLocations = await Location.findAll({
    where: { warehouse_id: parseInt(warehouse_id, 10), status: 'EMPTY' },
    order: [['zone', 'ASC'], ['aisle', 'ASC'], ['rack', 'ASC'], ['shelf', 'ASC'], ['bin', 'ASC']],
    limit: parseInt(qty, 10) || 50,
  });

  return {
    warehouse_id: parseInt(warehouse_id, 10),
    empty_bins_count: emptyLocations.length,
    suggestions: emptyLocations.map(l => ({
      location_id: l.id,
      bin_code: l.bin_code,
      zone: l.zone,
      priority: 'HIGH',
    })),
  };
};

module.exports = { getAll, getSuggest };
