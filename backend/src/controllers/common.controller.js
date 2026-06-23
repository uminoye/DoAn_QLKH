const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Dữ liệu không hợp lệ.', errors: errors.array() });
  }
  next();
};

const createHandler = (service) => async (req, res, next) => {
  try {
    validate(req, res, next);
    const result = await service.create(req.body);
    res.status(201).json({ message: 'Tạo thành công.', data: result });
  } catch (err) { next(err); }
};

const getAllHandler = (service) => async (req, res, next) => {
  try {
    const result = await service.getAll(req.query);
    res.json(result);
  } catch (err) { next(err); }
};

const getByIdHandler = (service) => async (req, res, next) => {
  try {
    const result = await service.getById(parseInt(req.params.id, 10));
    res.json(result);
  } catch (err) { next(err); }
};

const updateHandler = (service) => async (req, res, next) => {
  try {
    const result = await service.updateById(parseInt(req.params.id, 10), req.body);
    res.json({ message: 'Cập nhật thành công.', data: result });
  } catch (err) { next(err); }
};

const deleteHandler = (service) => async (req, res, next) => {
  try {
    await service.deleteById(parseInt(req.params.id, 10));
    res.json({ message: 'Xóa thành công.' });
  } catch (err) { next(err); }
};

module.exports = { validate, createHandler, getAllHandler, getByIdHandler, updateHandler, deleteHandler };
