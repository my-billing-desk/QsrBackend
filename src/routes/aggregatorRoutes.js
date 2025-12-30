const express = require('express');
const router = express.Router();
const aggregatorController = require('../controllers/AggregatorController');

const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, aggregatorController.getAll);
router.post('/:id/toggle', protect, aggregatorController.updateSettings);
router.post('/:id/verify', protect, aggregatorController.verify);
router.post('/webhook', aggregatorController.webhook);
router.post('/ondc/confirm', aggregatorController.ondcWebhook);

module.exports = router;
