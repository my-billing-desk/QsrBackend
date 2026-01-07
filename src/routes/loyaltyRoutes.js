const express = require('express');
const router = express.Router();
const loyaltyController = require('../controllers/LoyaltyController');
const { protect } = require('../middleware/authMiddleware');

// Config
router.get('/config', protect, loyaltyController.getLoyaltyConfig);
router.put('/config', protect, loyaltyController.updateLoyaltyConfig);

// Tiers
router.get('/tiers', protect, loyaltyController.getLoyaltyTiers);
router.post('/tiers', protect, loyaltyController.saveLoyaltyTier);
router.delete('/tiers/:id', protect, loyaltyController.deleteLoyaltyTier);

// Rewards
router.get('/rewards', protect, loyaltyController.getLoyaltyRewards);
router.post('/rewards', protect, loyaltyController.saveLoyaltyReward);
router.delete('/rewards/:id', protect, loyaltyController.deleteLoyaltyReward);

// Customer Status
router.get('/customer/:phone', protect, loyaltyController.getCustomerLoyalty);

// Analytics
router.get('/analytics', protect, loyaltyController.getLoyaltyAnalytics);
router.post('/redeem', protect, loyaltyController.redeemPoints);


module.exports = router;
