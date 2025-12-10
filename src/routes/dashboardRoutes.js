const express = require('express');
const router = express.Router();
const controller = require('../controllers/DashboardController');

router.get('/stats', controller.getStats);
router.post('/clear-data', controller.clearDatabase);

module.exports = router;
