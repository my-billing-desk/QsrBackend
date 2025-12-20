const express = require('express');
const router = express.Router();
const controller = require('../controllers/orderController');

router.get('/', controller.getOrders);
router.post('/', controller.createOrder);
router.post('/sync', controller.updateSync);
router.put('/:id', controller.updateOrder);
router.post('/mark-kot-printed', controller.markKotPrinted);

module.exports = router;
