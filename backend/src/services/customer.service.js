const { Customer } = require('../models');
const { AppError } = require('../utils/AppError');
const { getNextCode } = require('../utils/codeGenerator');

const getAll = async (queryParams) => {
  const { search } = queryParams;
  const where = {};
  if (search) {
    const { Op } = require('sequelize');
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { customer_code: { [Op.iLike]: `%${search}%` } },
      { phone: { [Op.iLike]: `%${search}%` } },
    ];
  }
  return Customer.findAll({ where, order: [['id', 'ASC']] });
};

const getById = async (id) => {
  const customer = await Customer.findByPk(id);
  if (!customer) throw new AppError('Khách hàng không tồn tại.', 404);
  return customer.toJSON();
};

const create = async (data) => {
  const code = await getNextCode('KH', 'seq_customer');
  return Customer.create({ ...data, customer_code: code });
};

const updateById = async (id, data) => {
  const customer = await Customer.findByPk(id);
  if (!customer) throw new AppError('Khách hàng không tồn tại.', 404);
  await customer.update(data);
  return customer.toJSON();
};

const deleteById = async (id) => {
  const customer = await Customer.findByPk(id);
  if (!customer) throw new AppError('Khách hàng không tồn tại.', 404);
  await customer.destroy();
};

module.exports = { getAll, getById, create, updateById, deleteById };
