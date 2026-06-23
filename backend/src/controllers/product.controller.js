const productService = require('../services/product.service');

const getAll = async (req, res, next) => {
  try { res.json(await productService.getAll(req.query)); }
  catch (err) { next(err); }
};
const getById = async (req, res, next) => {
  try { res.json(await productService.getById(parseInt(req.params.id, 10))); }
  catch (err) { next(err); }
};
const create = async (req, res, next) => {
  try {
    const result = await productService.create(req.body);
    res.status(201).json({ message: 'Tạo sản phẩm thành công.', data: result });
  } catch (err) { next(err); }
};
const updateById = async (req, res, next) => {
  try {
    const result = await productService.updateById(parseInt(req.params.id, 10), req.body);
    res.json({ message: 'Cập nhật thành công.', data: result });
  } catch (err) { next(err); }
};
const deleteById = async (req, res, next) => {
  try {
    await productService.deleteById(parseInt(req.params.id, 10));
    res.json({ message: 'Xóa sản phẩm thành công.' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, updateById, deleteById };
