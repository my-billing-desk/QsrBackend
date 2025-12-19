const express = require('express');
const router = express.Router();
const SettingsController = require('../controllers/SettingsController');

router.get('/', SettingsController.getSettings);
router.post('/', SettingsController.updateSettings);

module.exports = router;
