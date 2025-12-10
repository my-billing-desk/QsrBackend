const express = require('express');
const router = express.Router();
const controller = require('../controllers/ConfigController');

// Tables
router.get('/tables', controller.getTables);
router.post('/tables', controller.createTable);
router.delete('/tables/:id', controller.deleteTable);

// Taxes
router.get('/taxes', controller.getTaxes);
router.post('/taxes', controller.createTax);
router.delete('/taxes/:id', controller.deleteTax);

// Discounts
router.get('/discounts', controller.getDiscounts);
router.post('/discounts', controller.createDiscount);
router.delete('/discounts/:id', controller.deleteDiscount);

module.exports = router;
