const express = require('express');
const router = express.Router();
const controller = require('../controllers/AuthController');

const { protect, authorize } = require('../middleware/authMiddleware');

const userManagers = ['super_admin', 'admin'];

router.post('/login', controller.login);
router.post('/register', protect, authorize(...userManagers), controller.register);
router.get('/users', protect, authorize(...userManagers), controller.getUsers);
router.put('/users/:id', protect, authorize(...userManagers), controller.updateUser);
router.delete('/users/:id', protect, authorize(...userManagers), controller.deleteUser);
router.get('/sync-users', protect, controller.syncUsers); // POS needs this, usually protected by terminal token or standard user token
router.get('/init-terminal/:idOrSubdomain', controller.initTerminal);
router.post('/send-otp', controller.sendOTP);
router.post('/verify-otp', controller.verifyOTP);
router.get('/me', protect, controller.getProfile);

// Google Auth
router.get('/google', controller.googleLogin);
router.get('/google/callback', controller.googleCallback);

module.exports = router;
