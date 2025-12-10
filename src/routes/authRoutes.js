const express = require('express');
const router = express.Router();
const controller = require('../controllers/AuthController');

router.post('/login', controller.login);
router.post('/register', controller.register);
router.get('/users', controller.getUsers);

// Google Auth
router.get('/google', controller.googleLogin);
router.get('/google/callback', controller.googleCallback);

module.exports = router;
