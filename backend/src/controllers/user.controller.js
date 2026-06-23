const userService = require('../services/user.service');

const getAll = async (req, res, next) => {
  try {
    const users = await userService.getAll();
    res.json(users);
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const user = await userService.getById(parseInt(req.params.id, 10));
    res.json(user);
  } catch (err) { next(err); }
};

const updateById = async (req, res, next) => {
  try {
    const user = await userService.updateById(parseInt(req.params.id, 10), req.body);
    res.json({ message: 'Cập nhật thành công.', user });
  } catch (err) { next(err); }
};

const deleteById = async (req, res, next) => {
  try {
    await userService.deleteById(parseInt(req.params.id, 10));
    res.json({ message: 'Xóa người dùng thành công.' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, updateById, deleteById };
