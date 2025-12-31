const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/DashboardController');

const { protect, authorize } = require('../middleware/authMiddleware');

const managers = ['super_admin', 'admin', 'zone_manager', 'area_manager', 'city_manager', 'restaurant_manager'];

router.get('/stats', protect, authorize(...managers), dashboardController.getStats);
router.get('/charts', protect, authorize(...managers), dashboardController.getCharts);
router.get('/recent-orders', protect, authorize(...managers), dashboardController.getRecentOrders);
router.get('/top-items', protect, authorize(...managers), dashboardController.getTopItems);

module.exports = router;
