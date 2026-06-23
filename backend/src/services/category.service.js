const { Category } = require('../models');
const { AppError } = require('../utils/AppError');

const getAll = async () => Category.findAll({ order: [['id', 'ASC']] });
const getById = async (id) => {
  const cat = await Category.findByPk(id);
  if (!cat) throw new AppError('Danh mục không tồn tại.', 404);
  return cat.toJSON();
};
const create = async (data) => {
  const existing = await Category.findOne({ where: { name: data.name } });
  if (existing) throw new AppError('Tên danh mục đã tồn tại.', 409);
  const cat = await Category.create(data);
  return cat.toJSON();
};
const updateById = async (id, data) => {
  const cat = await Category.findByPk(id);
  if (!cat) throw new AppError('Danh mục không tồn tại.', 404);
  await cat.update(data);
  return cat.toJSON();
};
const deleteById = async (id) => {
  const cat = await Category.findByPk(id);
  if (!cat) throw new AppError('Danh mục không tồn tại.', 404);
  await cat.destroy();
};

module.exports = { getAll, getById, create, updateById, deleteById };
