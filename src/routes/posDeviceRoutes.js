const express = require('express');
const router = express.Router();
const POSDeviceController = require('../controllers/POSDeviceController');
const { protect, authorize } = require('../middleware/authMiddleware');

const managers = ['super_admin', 'admin', 'restaurant_manager'];

// All routes require authentication
router.use(protect);

// Register or update a device
router.post('/register', authorize(...managers), POSDeviceController.registerDevice);

// Update device heartbeat
router.post('/heartbeat', POSDeviceController.updateHeartbeat);

// Get all devices
router.get('/', authorize(...managers), POSDeviceController.getDevices);

// Get device statistics
router.get('/stats', authorize(...managers), POSDeviceController.getDeviceStats);

// Deactivate a device
router.put('/:id/deactivate', authorize(...managers), POSDeviceController.deactivateDevice);

module.exports = router;
