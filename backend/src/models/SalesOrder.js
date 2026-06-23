const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SalesOrder = sequelize.define('SalesOrder', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  sales_order_code: { type: DataTypes.STRING(20), unique: true, allowNull: false },
  customer_id: { type: DataTypes.INTEGER },
  warehouse_id: { type: DataTypes.INTEGER },
  total_amount: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
  status: {
    type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED'),
    defaultValue: 'PENDING',
  },
  created_by: { type: DataTypes.INTEGER },
  approved_by: { type: DataTypes.INTEGER },
}, {
  tableName: 'sales_orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

const SalesOrderItem = sequelize.define('SalesOrderItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  sales_order_id: { type: DataTypes.INTEGER, allowNull: false },
  product_id: { type: DataTypes.INTEGER },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  unit_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
}, {
  tableName: 'sales_order_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = { SalesOrder, SalesOrderItem };
