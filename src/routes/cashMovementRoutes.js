const express = require('express');
const router = express.Router();
const CashMovementController = require('../controllers/CashMovementController');
const { protect, authorize } = require('../middleware/authMiddleware');

const managers = ['super_admin', 'admin', 'zone_manager', 'area_manager', 'city_manager', 'restaurant_manager'];
const admins = ['super_admin', 'admin'];

// All routes require authentication
router.use(protect);

// Record cash in
router.post('/cash-in', CashMovementController.cashIn);

// Record cash out
router.post('/cash-out', CashMovementController.cashOut);

// Get all cash movements (with optional filters)
router.get('/', authorize(...managers), CashMovementController.getAllMovements);

// Get summary/report
router.get('/summary', authorize(...managers), CashMovementController.getSummary);

// Delete a cash movement (admin only)
router.delete('/:id', authorize(...admins), CashMovementController.deleteMovement);

module.exports = router;
