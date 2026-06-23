const express = require('express');
const router = express.Router();
const inboundController = require('../controllers/inbound.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', authorize('ADMIN', 'MANAGER', 'KHO'), inboundController.getAll);
router.get('/suggest-bins', authorize('ADMIN', 'MANAGER', 'KHO'), inboundController.suggestBins);
router.get('/:id', authorize('ADMIN', 'MANAGER', 'KHO'), inboundController.getById);
router.post('/', authorize('ADMIN', 'KHO'), inboundController.create);
router.put('/:id/approve', authorize('ADMIN', 'MANAGER'), inboundController.approve);
router.put('/:id/reject', authorize('ADMIN', 'MANAGER'), inboundController.reject);

module.exports = router;
