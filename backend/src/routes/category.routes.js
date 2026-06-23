const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', categoryController.getAll);
router.get('/:id', categoryController.getById);
router.post(
  '/',
  authorize('ADMIN'),
  [body('name').notEmpty().withMessage('Tên danh mục là bắt buộc.')],
  categoryController.create
);
router.put('/:id', authorize('ADMIN'), categoryController.updateById);
router.delete('/:id', authorize('ADMIN'), categoryController.deleteById);

module.exports = router;
