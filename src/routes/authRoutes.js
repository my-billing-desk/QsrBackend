const express = require('express');
const router = express.Router();
const controller = require('../controllers/AuthController');

const { protect } = require('../middleware/authMiddleware');

router.post('/login', controller.login);
router.post('/register', protect, controller.register);
router.get('/users', protect, controller.getUsers);
router.get('/me', protect, controller.me);

// Google Auth
router.get('/google', controller.googleLogin);
router.get('/google/callback', controller.googleCallback);

router.get('/init-terminal/:id', controller.initTerminal);
router.post('/send-otp', controller.sendOTP);
router.post('/verify-otp', controller.verifyOTP);
router.get('/sync-users', protect, controller.getUsers);

module.exports = router;
