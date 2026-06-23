const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Warehouse = sequelize.define('Warehouse', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  address: { type: DataTypes.TEXT },
  total_capacity: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'warehouses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = Warehouse;
