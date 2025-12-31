const express = require('express');
const router = express.Router();
const OutletController = require('../controllers/OutletController');

const { protect, authorize } = require('../middleware/authMiddleware');

const configAdmins = ['super_admin', 'admin'];

router.get('/outlet', protect, OutletController.getOutletConfig);
router.post('/outlet', protect, authorize(...configAdmins), OutletController.updateOutletConfig);

module.exports = router;
