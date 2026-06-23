const salesService = require('../services/sales.service');

const getAll = async (req, res, next) => {
  try { res.json(await salesService.getAll(req.query)); }
  catch (err) { next(err); }
};
const getById = async (req, res, next) => {
  try { res.json(await salesService.getById(parseInt(req.params.id, 10))); }
  catch (err) { next(err); }
};
const create = async (req, res, next) => {
  try {
    const result = await salesService.create(req.body, req.user.id);
    res.status(201).json({ message: 'Tạo đơn hàng thành công.', data: result });
  } catch (err) { next(err); }
};
const approve = async (req, res, next) => {
  try {
    const result = await salesService.approve(parseInt(req.params.id, 10), req.user.id);
    res.json({ message: 'Duyệt đơn hàng thành công. Outbound tự động tạo.', data: result });
  } catch (err) { next(err); }
};
const reject = async (req, res, next) => {
  try {
    const result = await salesService.reject(parseInt(req.params.id, 10), req.user.id);
    res.json({ message: 'Từ chối đơn hàng.', data: result });
  } catch (err) { next(err); }
};
const checkStock = async (req, res, next) => {
  try {
    const { items, warehouse_id } = req.query;
    const result = await salesService.checkStock(JSON.parse(items || '[]'), parseInt(warehouse_id, 10));
    res.json(result);
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, approve, reject, checkStock };
