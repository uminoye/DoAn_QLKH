const inboundService = require('../services/inbound.service');

const getAll = async (req, res, next) => {
  try { res.json(await inboundService.getAll(req.query)); }
  catch (err) { next(err); }
};
const getById = async (req, res, next) => {
  try { res.json(await inboundService.getById(parseInt(req.params.id, 10))); }
  catch (err) { next(err); }
};
const create = async (req, res, next) => {
  try {
    const result = await inboundService.create(req.body, req.user.id);
    res.status(201).json({ message: 'Tạo phiếu nhập thành công.', data: result });
  } catch (err) { next(err); }
};
const approve = async (req, res, next) => {
  try {
    const result = await inboundService.approve(parseInt(req.params.id, 10), req.user.id);
    res.json({ message: 'Duyệt phiếu nhập thành công.', data: result });
  } catch (err) { next(err); }
};
const reject = async (req, res, next) => {
  try {
    const result = await inboundService.reject(parseInt(req.params.id, 10), req.user.id);
    res.json({ message: 'Từ chối phiếu nhập.', data: result });
  } catch (err) { next(err); }
};
const suggestBins = async (req, res, next) => {
  try {
    const { warehouse_id, product_id, qty } = req.query;
    const result = await inboundService.suggestBins(warehouse_id, product_id, qty);
    res.json(result);
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, approve, reject, suggestBins };
