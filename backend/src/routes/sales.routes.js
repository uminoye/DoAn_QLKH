const express = require('express');
const router = express.Router();
const salesController = require('../controllers/sales.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', authorize('SALES', 'MANAGER', 'ADMIN'), salesController.getAll);
router.get('/stock-check', salesController.checkStock);
router.get('/:id', salesController.getById);
router.post('/', authorize('SALES', 'ADMIN'), salesController.create);
router.put('/:id/approve', authorize('MANAGER', 'ADMIN'), salesController.approve);
router.put('/:id/reject', authorize('MANAGER', 'ADMIN'), salesController.reject);

module.exports = router;
