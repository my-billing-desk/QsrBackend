const express = require('express');
const router = express.Router();
const controller = require('../controllers/AuthController');

const { protect } = require('../middleware/authMiddleware');

router.post('/login', controller.login);
router.post('/register', protect, controller.register);
router.get('/users', protect, controller.getUsers);
router.get('/sync-users', protect, controller.syncUsers);
router.get('/init-terminal/:idOrSubdomain', controller.initTerminal);
router.get('/me', protect, controller.getProfile);

// Google Auth
router.get('/google', controller.googleLogin);
router.get('/google/callback', controller.googleCallback);

module.exports = router;
