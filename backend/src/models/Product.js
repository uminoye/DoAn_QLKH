const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  sku: { type: DataTypes.STRING(20), unique: true, allowNull: false },
  name: { type: DataTypes.STRING(200), allowNull: false },
  category_id: { type: DataTypes.INTEGER },
  unit: { type: DataTypes.STRING(30), defaultValue: 'Cái' },
  price: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  image_url: { type: DataTypes.TEXT },
}, {
  tableName: 'products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Product;
