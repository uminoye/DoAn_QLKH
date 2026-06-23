const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  email: { type: DataTypes.STRING(100), unique: true, allowNull: false },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  full_name: { type: DataTypes.STRING(100), allowNull: false },
  role: {
    type: DataTypes.ENUM('ADMIN', 'MANAGER', 'KHO', 'SALES'),
    allowNull: false,
  },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password_hash && !user.password_hash.startsWith('$2')) {
        user.password_hash = await bcrypt.hash(user.password_hash, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password_hash') && !user.password_hash.startsWith('$2')) {
        user.password_hash = await bcrypt.hash(user.password_hash, 10);
      }
    },
  },
});

User.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password_hash);
};

User.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.password_hash;
  return values;
};

module.exports = User;
