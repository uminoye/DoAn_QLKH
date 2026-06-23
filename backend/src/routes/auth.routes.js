const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.post(
  '/login',
  [
    body('username').notEmpty().withMessage('Tên đăng nhập là bắt buộc.'),
    body('password').notEmpty().withMessage('Mật khẩu là bắt buộc.'),
  ],
  authController.login
);

router.post(
  '/register',
  authenticate,
  authorize('ADMIN'),
  [
    body('username').notEmpty().isLength({ min: 3 }).withMessage('Tên đăng nhập tối thiểu 3 ký tự.'),
    body('email').isEmail().withMessage('Email không hợp lệ.'),
    body('password').isLength({ min: 6 }).withMessage('Mật khẩu tối thiểu 6 ký tự.'),
    body('full_name').notEmpty().withMessage('Họ tên là bắt buộc.'),
    body('role').isIn(['ADMIN', 'MANAGER', 'KHO', 'SALES']).withMessage('Vai trò không hợp lệ.'),
  ],
  authController.register
);

router.get('/me', authenticate, authController.getMe);

module.exports = router;
