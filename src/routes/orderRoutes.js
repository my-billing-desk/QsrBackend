const express = require('express');
const router = express.Router();
const controller = require('../controllers/OrderController');

router.get('/', controller.getOrders);
router.post('/', controller.createOrder);
router.get('/', controller.getOrders);
router.post('/sync', controller.updateSync);
router.put('/:id', controller.updateOrder);

module.exports = router;
