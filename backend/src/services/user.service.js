const { User } = require('../models');
const { AppError } = require('../utils/AppError');

const getAll = async () => {
  const users = await User.findAll({ attributes: { exclude: ['password_hash'] } });
  return users;
};

const getById = async (id) => {
  const user = await User.findByPk(id, { attributes: { exclude: ['password_hash'] } });
  if (!user) throw new AppError('Người dùng không tồn tại.', 404);
  return user.toJSON();
};

const updateById = async (id, data) => {
  const user = await User.findByPk(id);
  if (!user) throw new AppError('Người dùng không tồn tại.', 404);
  await user.update(data);
  return user.toJSON();
};

const deleteById = async (id) => {
  const user = await User.findByPk(id);
  if (!user) throw new AppError('Người dùng không tồn tại.', 404);
  await user.destroy();
};

module.exports = { getAll, getById, updateById, deleteById };
