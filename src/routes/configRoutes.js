const express = require('express');
const router = express.Router();
const OutletController = require('../controllers/OutletController');

const { protect } = require('../middleware/authMiddleware');

router.get('/outlet', protect, OutletController.getOutletConfig);
router.post('/outlet', protect, OutletController.updateOutletConfig);

module.exports = router;
