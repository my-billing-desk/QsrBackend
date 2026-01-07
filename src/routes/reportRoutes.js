const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

const { protect } = require('../middleware/authMiddleware');

router.get('/profit-loss', protect, reportController.getProfitLoss);

module.exports = router;
