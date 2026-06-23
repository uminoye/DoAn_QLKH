const categoryService = require('../services/category.service');

const getAll = async (req, res, next) => {
  try {
    const result = await categoryService.getAll();
    res.json(result);
  } catch (err) { next(err); }
};
const getById = async (req, res, next) => {
  try {
    const result = await categoryService.getById(parseInt(req.params.id, 10));
    res.json(result);
  } catch (err) { next(err); }
};
const create = async (req, res, next) => {
  try {
    const result = await categoryService.create(req.body);
    res.status(201).json({ message: 'Tạo danh mục thành công.', data: result });
  } catch (err) { next(err); }
};
const updateById = async (req, res, next) => {
  try {
    const result = await categoryService.updateById(parseInt(req.params.id, 10), req.body);
    res.json({ message: 'Cập nhật thành công.', data: result });
  } catch (err) { next(err); }
};
const deleteById = async (req, res, next) => {
  try {
    await categoryService.deleteById(parseInt(req.params.id, 10));
    res.json({ message: 'Xóa danh mục thành công.' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, updateById, deleteById };
