const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', authorize('SALES', 'MANAGER', 'ADMIN'), customerController.getAll);
router.get('/:id', customerController.getById);
router.post('/', authorize('SALES', 'ADMIN'), customerController.create);
router.put('/:id', authorize('SALES', 'ADMIN'), customerController.updateById);
router.delete('/:id', authorize('ADMIN'), customerController.deleteById);

module.exports = router;
