const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const ExpenseController = require('../controllers/ExpenseController');
const WithdrawalController = require('../controllers/WithdrawalController');
const CashTopUpController = require('../controllers/CashTopUpController');

// --- Expenses ---
router.get('/expenses', protect, ExpenseController.getExpenses);
router.post('/expenses', protect, ExpenseController.createExpense);
router.delete('/expenses/:id', protect, ExpenseController.deleteExpense);

router.delete('/expenses', protect, ExpenseController.deleteExpensesByDate);
router.get('/expense-categories', protect, ExpenseController.getExpenseCategories);
router.get('/expense-master', protect, ExpenseController.getExpenseMaster);
router.post('/expense-categories', protect, ExpenseController.createExpenseCategory);
router.put('/expense-categories/:id', protect, ExpenseController.updateExpenseCategory);
router.delete('/expense-categories/:id', protect, ExpenseController.deleteExpenseCategory);

// --- Withdrawals ---
router.get('/withdrawals', protect, WithdrawalController.getWithdrawals);
router.post('/withdrawals', protect, WithdrawalController.createWithdrawal);
router.delete('/withdrawals/:id', protect, WithdrawalController.deleteWithdrawal);

router.get('/withdrawal-categories', protect, WithdrawalController.getWithdrawalCategories);
router.get('/withdrawal-master', protect, WithdrawalController.getWithdrawalMaster);
router.post('/withdrawal-categories', protect, WithdrawalController.createWithdrawalCategory);
router.put('/withdrawal-categories/:id', protect, WithdrawalController.updateWithdrawalCategory);
router.delete('/withdrawal-categories/:id', protect, WithdrawalController.deleteWithdrawalCategory);

// --- Cash Top-Ups ---
router.get('/cash-topups', protect, CashTopUpController.getCashTopUps);
router.post('/cash-topups', protect, CashTopUpController.createCashTopUp);
router.delete('/cash-topups/:id', protect, CashTopUpController.deleteCashTopUp);

router.get('/cash-topup-categories', protect, CashTopUpController.getCashTopUpCategories);
router.get('/cash-topup-master', protect, CashTopUpController.getCashTopUpMaster);
router.post('/cash-topup-categories', protect, CashTopUpController.createCashTopUpCategory);
router.put('/cash-topup-categories/:id', protect, CashTopUpController.updateCashTopUpCategory);
router.delete('/cash-topup-categories/:id', protect, CashTopUpController.deleteCashTopUpCategory);

module.exports = router;
