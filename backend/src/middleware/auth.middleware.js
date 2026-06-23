const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Không có token. Vui lòng đăng nhập.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret);

    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password_hash'] },
    });

    if (!user) {
      return res.status(401).json({ message: 'Người dùng không tồn tại.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: 'Tài khoản đã bị vô hiệu hóa.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token đã hết hạn. Vui lòng đăng nhập lại.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token không hợp lệ.' });
    }
    return res.status(500).json({ message: 'Lỗi xác thực.' });
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Chưa xác thực.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Không có quyền truy cập. Vai trò yêu cầu: ${allowedRoles.join(' hoặc ')}.`,
      });
    }

    next();
  };
};

module.exports = { authenticate, authorize };
