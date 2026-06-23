const outboundService = require('../services/outbound.service');

const getAll = async (req, res, next) => {
  try { res.json(await outboundService.getAll(req.query)); }
  catch (err) { next(err); }
};
const getById = async (req, res, next) => {
  try { res.json(await outboundService.getById(parseInt(req.params.id, 10))); }
  catch (err) { next(err); }
};
const create = async (req, res, next) => {
  try {
    const result = await outboundService.create(req.body, req.user.id);
    res.status(201).json({ message: 'Tạo phiếu xuất thành công.', data: result });
  } catch (err) { next(err); }
};
const approve = async (req, res, next) => {
  try {
    const result = await outboundService.approve(parseInt(req.params.id, 10), req.user.id);
    res.json({ message: 'Duyệt phiếu xuất thành công.', data: result });
  } catch (err) { next(err); }
};
const complete = async (req, res, next) => {
  try {
    const result = await outboundService.complete(parseInt(req.params.id, 10), req.user.id);
    res.json({ message: 'Hoàn tất xuất kho thành công.', data: result });
  } catch (err) { next(err); }
};
const reject = async (req, res, next) => {
  try {
    const result = await outboundService.reject(parseInt(req.params.id, 10), req.user.id);
    res.json({ message: 'Từ chối phiếu xuất.', data: result });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, approve, complete, reject };
