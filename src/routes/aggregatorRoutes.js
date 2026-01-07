const express = require('express');
const router = express.Router();
const aggregatorController = require('../controllers/aggregatorController');

const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, aggregatorController.getAll);
router.post('/sync', protect, aggregatorController.syncMarketplace);
router.post('/:id/toggle', protect, aggregatorController.toggleStatus);
router.post('/:id/verify', protect, aggregatorController.verify);
router.post('/webhook', aggregatorController.webhook);

module.exports = router;
