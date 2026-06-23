const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Location = sequelize.define('Location', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  warehouse_id: { type: DataTypes.INTEGER, allowNull: false },
  bin_code: { type: DataTypes.STRING(30), unique: true, allowNull: false },
  zone: { type: DataTypes.STRING(10) },
  aisle: { type: DataTypes.STRING(10) },
  rack: { type: DataTypes.STRING(10) },
  shelf: { type: DataTypes.STRING(10) },
  bin: { type: DataTypes.STRING(10) },
  status: {
    type: DataTypes.ENUM('EMPTY', 'FULL'),
    defaultValue: 'EMPTY',
  },
  product_id: { type: DataTypes.INTEGER },
}, {
  tableName: 'locations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = Location;
