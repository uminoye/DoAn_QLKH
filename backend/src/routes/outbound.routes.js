const express = require('express');
const router = express.Router();
const outboundController = require('../controllers/outbound.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', authorize('ADMIN', 'MANAGER', 'KHO'), outboundController.getAll);
router.get('/:id', authorize('ADMIN', 'MANAGER', 'KHO'), outboundController.getById);
router.post('/', authorize('ADMIN', 'KHO'), outboundController.create);
router.put('/:id/approve', authorize('ADMIN', 'MANAGER'), outboundController.approve);
router.put('/:id/complete', authorize('ADMIN', 'MANAGER', 'KHO'), outboundController.complete);
router.put('/:id/reject', authorize('ADMIN', 'MANAGER'), outboundController.reject);

module.exports = router;
