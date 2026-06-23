const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const warehouseController = require('../controllers/warehouse.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', warehouseController.getAll);
router.get('/:id', warehouseController.getById);
router.post(
  '/',
  authorize('ADMIN'),
  [
    body('name').notEmpty().withMessage('Tên kho là bắt buộc.'),
    body('total_capacity')
      .isInt({ min: 0, max: 10000 })
      .withMessage('Sức chứa phải từ 0 đến 10000.'),
  ],
  warehouseController.create
);
router.put('/:id', authorize('ADMIN'), warehouseController.updateById);
router.delete('/:id', authorize('ADMIN'), warehouseController.deleteById);

module.exports = router;
