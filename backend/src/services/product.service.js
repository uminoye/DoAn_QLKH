const { Product, Category } = require('../models');
const { AppError } = require('../utils/AppError');
const { getNextCode } = require('../utils/codeGenerator');

const getAll = async (queryParams) => {
  const { category_id, search } = queryParams;
  const where = {};
  if (category_id) where.category_id = category_id;
  if (search) {
    where[require('sequelize').Op.or] = [
      { name: { [require('sequelize').Op.iLike]: `%${search}%` } },
      { sku: { [require('sequelize').Op.iLike]: `%${search}%` } },
    ];
  }
  const products = await Product.findAll({
    where,
    include: [{ model: Category, as: 'Category', attributes: ['id', 'name'] }],
    order: [['id', 'ASC']],
  });
  return products.map(p => ({
    ...p.toJSON(),
    category_name: p.Category ? p.Category.name : null,
  }));
};

const getById = async (id) => {
  const product = await Product.findByPk(id, {
    include: [{ model: Category, as: 'Category', attributes: ['id', 'name'] }],
  });
  if (!product) throw new AppError('Sản phẩm không tồn tại.', 404);
  return { ...product.toJSON(), category_name: product.Category ? product.Category.name : null };
};

const create = async (data) => {
  const code = await getNextCode('SP', 'seq_product');
  const product = await Product.create({ ...data, sku: code });
  return getById(product.id);
};

const updateById = async (id, data) => {
  const product = await Product.findByPk(id);
  if (!product) throw new AppError('Sản phẩm không tồn tại.', 404);
  await product.update(data);
  return getById(id);
};

const deleteById = async (id) => {
  const product = await Product.findByPk(id);
  if (!product) throw new AppError('Sản phẩm không tồn tại.', 404);
  await product.destroy();
};

module.exports = { getAll, getById, create, updateById, deleteById };
