const express = require('express');
const router = express.Router();
const CustomerController = require('../controllers/CustomerController');
const { protect, authorize } = require('../middleware/authMiddleware');

const managers = ['super_admin', 'admin', 'zone_manager', 'area_manager', 'city_manager', 'restaurant_manager'];

// All routes require authentication
router.use(protect);

// Lookup customer by phone (primary feature)
router.get('/lookup/:phone', CustomerController.lookupByPhone);

// Create or update customer
router.post('/', CustomerController.createOrUpdate);

// Update customer post-order (called after payment)
router.post('/post-order', CustomerController.updatePostOrder);

// Get all customers (admin)
router.get('/', authorize(...managers), CustomerController.getAllCustomers);

// Get customer statistics
router.get('/stats', authorize(...managers), CustomerController.getStats);

module.exports = router;
