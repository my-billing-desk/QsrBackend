const express = require('express');
const router = express.Router();
const SettingsController = require('../controllers/SettingsController');

const { protect, authorize } = require('../middleware/authMiddleware');

const admins = ['super_admin', 'admin', 'zone_manager'];

router.get('/', protect, SettingsController.getSettings);
router.post('/', protect, authorize(...admins), SettingsController.updateSettings);

module.exports = router;
