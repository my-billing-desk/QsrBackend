const express = require('express');
const router = express.Router();
const aggregatorController = require('../controllers/AggregatorController');

const { protect, authorize } = require('../middleware/authMiddleware');

const aggManagers = ['super_admin', 'admin', 'restaurant_manager'];

router.get('/', protect, aggregatorController.getAll);
router.post('/:id/toggle', protect, authorize(...aggManagers), aggregatorController.updateSettings);
router.post('/:id/verify', protect, authorize(...aggManagers), aggregatorController.verify);
router.post('/webhook', aggregatorController.webhook);
router.post('/ondc/confirm', aggregatorController.ondcWebhook);

module.exports = router;
