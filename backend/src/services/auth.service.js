const { User } = require('../models');
const { signToken } = require('../services/auth.service');
const { AppError } = require('../utils/AppError');

const login = async (username, password) => {
  const user = await User.findOne({ where: { username } });

  if (!user) {
    throw new AppError('Tên đăng nhập hoặc mật khẩu không đúng.', 401);
  }

  if (!user.is_active) {
    throw new AppError('Tài khoản đã bị vô hiệu hóa.', 403);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Tên đăng nhập hoặc mật khẩu không đúng.', 401);
  }

  const token = signToken(user.id);
  const userData = user.toJSON();

  return { token, user: userData };
};

const register = async (userData) => {
  const existing = await User.findOne({ where: { username: userData.username } });
  if (existing) {
    throw new AppError('Tên đăng nhập đã tồn tại.', 409);
  }

  const existingEmail = await User.findOne({ where: { email: userData.email } });
  if (existingEmail) {
    throw new AppError('Email đã được sử dụng.', 409);
  }

  const user = await User.create(userData);
  return user.toJSON();
};

const getMe = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: { exclude: ['password_hash'] },
  });
  if (!user) {
    throw new AppError('Người dùng không tồn tại.', 404);
  }
  return user.toJSON();
};

module.exports = { login, register, getMe };
