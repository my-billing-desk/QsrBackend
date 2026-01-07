const express = require('express');
const router = express.Router();
const customerController = require('../controllers/CustomerController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, customerController.getAllCustomers);
router.get('/stats', protect, customerController.getCustomerStats);
router.get('/:id', protect, customerController.getCustomerDetail);
router.post('/', protect, customerController.saveCustomer);

module.exports = router;
