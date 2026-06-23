const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InboundOrder = sequelize.define('InboundOrder', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  inbound_code: { type: DataTypes.STRING(20), unique: true, allowNull: false },
  warehouse_id: { type: DataTypes.INTEGER },
  notes: { type: DataTypes.TEXT },
  status: {
    type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
    defaultValue: 'PENDING',
  },
  created_by: { type: DataTypes.INTEGER },
  approved_by: { type: DataTypes.INTEGER },
}, {
  tableName: 'inbound_orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

const InboundOrderItem = sequelize.define('InboundOrderItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  inbound_order_id: { type: DataTypes.INTEGER, allowNull: false },
  product_id: { type: DataTypes.INTEGER },
  requested_quantity: { type: DataTypes.INTEGER, allowNull: false },
  assigned_location_id: { type: DataTypes.INTEGER },
}, {
  tableName: 'inbound_order_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = { InboundOrder, InboundOrderItem };
