const express = require('express');
const router = express.Router();
const POSDeviceController = require('../controllers/POSDeviceController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Register or update a device
router.post('/register', POSDeviceController.registerDevice);

// Update device heartbeat
router.post('/heartbeat', POSDeviceController.updateHeartbeat);

// Get all devices
router.get('/', POSDeviceController.getDevices);

// Get device statistics
router.get('/stats', POSDeviceController.getDeviceStats);

// Deactivate a device
router.put('/:id/deactivate', POSDeviceController.deactivateDevice);

module.exports = router;
