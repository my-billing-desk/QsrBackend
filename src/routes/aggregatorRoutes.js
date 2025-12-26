const express = require('express');
const router = express.Router();
const aggregatorController = require('../controllers/aggregatorController');

const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, aggregatorController.getAll);
router.post('/:id/toggle', protect, aggregatorController.toggleStatus);
router.post('/webhook', aggregatorController.webhook);

module.exports = router;
