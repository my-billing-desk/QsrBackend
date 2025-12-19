const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/profit-loss', reportController.getProfitLoss);

module.exports = router;
