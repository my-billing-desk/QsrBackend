const express = require('express');
const router = express.Router();
const OnboardingController = require('../controllers/OnboardingController');

router.post('/signup', OnboardingController.signup);

module.exports = router;
