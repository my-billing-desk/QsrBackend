const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/DashboardController');

router.get('/stats', dashboardController.getStats);
router.get('/charts', dashboardController.getCharts);
router.get('/recent-orders', dashboardController.getRecentOrders);
router.get('/top-items', dashboardController.getTopItems);

module.exports = router;
