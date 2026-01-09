const express = require('express');
const router = express.Router();
const OutletController = require('../controllers/OutletController');
const ConfigController = require('../controllers/ConfigController');

const { protect } = require('../middleware/authMiddleware');

router.get('/outlet', protect, OutletController.getOutletConfig);
router.post('/outlet', protect, OutletController.updateOutletConfig);

// Tables
router.get('/tables', protect, ConfigController.getTables);
router.post('/tables', protect, ConfigController.createTable);
router.delete('/tables/:id', protect, ConfigController.deleteTable);

// Taxes
router.get('/taxes', protect, ConfigController.getTaxes);
router.post('/taxes', protect, ConfigController.createTax);
router.delete('/taxes/:id', protect, ConfigController.deleteTax);

// Discounts
router.get('/discounts', protect, ConfigController.getDiscounts);
router.post('/discounts', protect, ConfigController.createDiscount);
router.delete('/discounts/:id', protect, ConfigController.deleteDiscount);

module.exports = router;
