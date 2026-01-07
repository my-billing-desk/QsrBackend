const express = require('express');
const router = express.Router();
const controller = require('../controllers/PosDeviceController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', controller.getAll);
router.get('/stats', controller.getStats);
router.post('/register', controller.register);
router.post('/heartbeat', controller.heartbeat);
router.put('/:id/deactivate', controller.deactivate);

module.exports = router;
