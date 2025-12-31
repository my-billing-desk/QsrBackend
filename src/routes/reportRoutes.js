const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

const { protect, authorize } = require('../middleware/authMiddleware');

const financialAccess = ['super_admin', 'admin', 'zone_manager', 'area_manager', 'city_manager', 'restaurant_manager'];

router.get('/profit-loss', protect, authorize(...financialAccess), reportController.getProfitLoss);

module.exports = router;
