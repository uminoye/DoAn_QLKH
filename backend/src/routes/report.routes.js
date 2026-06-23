const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/dashboard', reportController.getDashboardStats);
router.get('/inventory-summary', authorize('ADMIN', 'MANAGER'), reportController.getInventorySummary);
router.get('/inbound-summary', authorize('ADMIN', 'MANAGER'), reportController.getInboundSummary);
router.get('/outbound-summary', authorize('ADMIN', 'MANAGER'), reportController.getOutboundSummary);
router.get('/sales-summary', authorize('ADMIN'), reportController.getSalesSummary);

module.exports = router;
