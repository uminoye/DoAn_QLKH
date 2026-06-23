const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Inventory = sequelize.define('Inventory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  product_id: { type: DataTypes.INTEGER, allowNull: false },
  warehouse_id: { type: DataTypes.INTEGER, allowNull: false },
  location_id: { type: DataTypes.INTEGER, allowNull: false },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0 },
  },
}, {
  tableName: 'inventory',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { unique: true, fields: ['product_id', 'warehouse_id', 'location_id'] },
  ],
});

module.exports = Inventory;
