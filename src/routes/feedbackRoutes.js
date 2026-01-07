const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/FeedbackController');
const { protect } = require('../middleware/authMiddleware');

// Public endpoint for customers to submit feedback (could be via QR code on bill)
// Note: In a real app, you might want some validation or a token from the bill
router.post('/submit', feedbackController.submitFeedback);
router.get('/order/:orderId', feedbackController.lookupOrder);


// Protected endpoints for admin
router.get('/', protect, feedbackController.getAllFeedback);
router.get('/analytics', protect, feedbackController.getFeedbackAnalytics);
router.put('/:id/status', protect, feedbackController.updateStatus);

module.exports = router;
