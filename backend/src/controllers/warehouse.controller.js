const { validationResult } = require('express-validator');
const warehouseService = require('../services/warehouse.service');

const getAll = async (req, res, next) => {
  try {
    const warehouses = await warehouseService.getAll();
    res.json(warehouses);
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const warehouse = await warehouseService.getById(parseInt(req.params.id, 10));
    res.json(warehouse);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Dữ liệu không hợp lệ.', errors: errors.array() });
    }
    const warehouse = await warehouseService.create(req.body);
    res.status(201).json({ message: 'Tạo kho thành công.', warehouse });
  } catch (err) { next(err); }
};

const updateById = async (req, res, next) => {
  try {
    const warehouse = await warehouseService.updateById(parseInt(req.params.id, 10), req.body);
    res.json({ message: 'Cập nhật thành công.', warehouse });
  } catch (err) { next(err); }
};

const deleteById = async (req, res, next) => {
  try {
    await warehouseService.deleteById(parseInt(req.params.id, 10));
    res.json({ message: 'Xóa kho thành công.' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, updateById, deleteById };
