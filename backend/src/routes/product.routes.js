const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', productController.getAll);
router.get('/:id', productController.getById);
router.post(
  '/',
  authorize('ADMIN'),
  [
    body('name').notEmpty().withMessage('Tên sản phẩm là bắt buộc.'),
    body('price').isFloat({ min: 0 }).withMessage('Giá phải >= 0.'),
  ],
  productController.create
);
router.put('/:id', authorize('ADMIN'), productController.updateById);
router.delete('/:id', authorize('ADMIN'), productController.deleteById);

module.exports = router;
