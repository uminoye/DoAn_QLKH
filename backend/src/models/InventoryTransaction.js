const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InventoryTransaction = sequelize.define('InventoryTransaction', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  product_id: { type: DataTypes.INTEGER },
  warehouse_id: { type: DataTypes.INTEGER },
  location_id: { type: DataTypes.INTEGER },
  transaction_type: {
    type: DataTypes.ENUM('INBOUND', 'OUTBOUND', 'SALE', 'ADJUST'),
    allowNull: false,
  },
  reference_type: { type: DataTypes.STRING(30) },
  reference_id: { type: DataTypes.INTEGER },
  quantity_change: { type: DataTypes.INTEGER, allowNull: false },
  quantity_after: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER },
}, {
  tableName: 'inventory_transactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = InventoryTransaction;
