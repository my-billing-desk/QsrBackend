const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/DashboardController');

const { protect } = require('../middleware/authMiddleware');

router.get('/stats', protect, dashboardController.getStats);
router.get('/charts', protect, dashboardController.getCharts);
router.get('/recent-orders', protect, dashboardController.getRecentOrders);
router.get('/top-items', protect, dashboardController.getTopItems);
router.get('/sales-breakdown', protect, dashboardController.getSalesBreakdown);

module.exports = router;
