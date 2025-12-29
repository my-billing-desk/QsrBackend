const express = require('express');
const router = express.Router();
const CashMovementController = require('../controllers/CashMovementController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Record cash in
router.post('/cash-in', CashMovementController.cashIn);

// Record cash out
router.post('/cash-out', CashMovementController.cashOut);

// Get all cash movements (with optional filters)
router.get('/', CashMovementController.getAllMovements);

// Get summary/report
router.get('/summary', CashMovementController.getSummary);

// Delete a cash movement (admin only)
router.delete('/:id', CashMovementController.deleteMovement);

module.exports = router;
