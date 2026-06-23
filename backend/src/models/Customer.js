const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Customer = sequelize.define('Customer', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  customer_code: { type: DataTypes.STRING(20), unique: true, allowNull: false },
  name: { type: DataTypes.STRING(200), allowNull: false },
  phone: { type: DataTypes.STRING(20) },
  email: { type: DataTypes.STRING(100) },
  address: { type: DataTypes.TEXT },
}, {
  tableName: 'customers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = Customer;
