const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OutboundOrder = sequelize.define('OutboundOrder', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  outbound_code: { type: DataTypes.STRING(20), unique: true, allowNull: false },
  warehouse_id: { type: DataTypes.INTEGER },
  notes: { type: DataTypes.TEXT },
  status: {
    type: DataTypes.ENUM('PENDING', 'APPROVED', 'COMPLETED', 'REJECTED'),
    defaultValue: 'PENDING',
  },
  created_by: { type: DataTypes.INTEGER },
  approved_by: { type: DataTypes.INTEGER },
  completed_at: { type: DataTypes.DATE },
}, {
  tableName: 'outbound_orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

const OutboundOrderItem = sequelize.define('OutboundOrderItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  outbound_order_id: { type: DataTypes.INTEGER, allowNull: false },
  product_id: { type: DataTypes.INTEGER },
  requested_quantity: { type: DataTypes.INTEGER, allowNull: false },
  picked_quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
  picked_location_id: { type: DataTypes.INTEGER },
}, {
  tableName: 'outbound_order_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = { OutboundOrder, OutboundOrderItem };
