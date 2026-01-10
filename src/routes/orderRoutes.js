const express = require('express');
const router = express.Router();
const controller = require('../controllers/OrderController');

const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, controller.getOrders);
router.post('/', protect, controller.createOrder);
router.post('/sync', protect, controller.updateSync);
router.put('/:id', protect, controller.updateOrder);
router.post('/mark-kot-printed', protect, controller.markKotPrinted);
router.post('/send-delete-otp', protect, controller.sendDeleteOTP);
router.post('/delete-bulk', protect, controller.deleteOrders);

module.exports = router;
