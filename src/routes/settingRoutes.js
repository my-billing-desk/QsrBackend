const express = require('express');
const router = express.Router();
const SettingsController = require('../controllers/SettingsController');

const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, SettingsController.getSettings);
router.post('/', protect, SettingsController.updateSettings);

module.exports = router;
