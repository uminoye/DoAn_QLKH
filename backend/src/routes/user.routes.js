const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', authorize('ADMIN'), userController.getAll);
router.get('/:id', userController.getById);
router.put('/:id', authorize('ADMIN'), userController.updateById);
router.delete('/:id', authorize('ADMIN'), userController.deleteById);

module.exports = router;
