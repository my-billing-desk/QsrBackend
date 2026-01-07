const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/SubscriptionController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, subscriptionController.getAll);
router.post('/buy', protect, subscriptionController.buy);

module.exports = router;
