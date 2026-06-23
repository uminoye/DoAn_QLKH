const express = require('express');
const router = express.Router();
const locationController = require('../controllers/location.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', authorize('ADMIN', 'MANAGER', 'KHO'), locationController.getAll);
router.get('/suggest', authorize('ADMIN', 'MANAGER', 'KHO'), locationController.getSuggest);

module.exports = router;
