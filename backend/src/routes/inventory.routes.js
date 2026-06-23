const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/pivot', authorize('ADMIN', 'MANAGER'), inventoryController.getPivotReport);
router.get('/', authorize('ADMIN', 'MANAGER', 'KHO'), inventoryController.getByWarehouse);
router.get('/stock/:productId', inventoryController.getStockByProduct);
router.get('/trace/:productId', authorize('ADMIN', 'MANAGER', 'KHO'), inventoryController.traceProduct);

module.exports = router;
