const customerService = require('../services/customer.service');

const getAll = async (req, res, next) => {
  try { res.json(await customerService.getAll(req.query)); }
  catch (err) { next(err); }
};
const getById = async (req, res, next) => {
  try { res.json(await customerService.getById(parseInt(req.params.id, 10))); }
  catch (err) { next(err); }
};
const create = async (req, res, next) => {
  try {
    const result = await customerService.create(req.body);
    res.status(201).json({ message: 'Tạo khách hàng thành công.', data: result });
  } catch (err) { next(err); }
};
const updateById = async (req, res, next) => {
  try {
    const result = await customerService.updateById(parseInt(req.params.id, 10), req.body);
    res.json({ message: 'Cập nhật thành công.', data: result });
  } catch (err) { next(err); }
};
const deleteById = async (req, res, next) => {
  try {
    await customerService.deleteById(parseInt(req.params.id, 10));
    res.json({ message: 'Xóa khách hàng thành công.' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, updateById, deleteById };
