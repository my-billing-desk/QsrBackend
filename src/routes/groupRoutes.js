const express = require('express');
const router = express.Router();
const groupController = require('../controllers/GroupController');

const { protect, authorize } = require('../middleware/authMiddleware');

const managers = ['super_admin', 'admin', 'zone_manager', 'area_manager', 'city_manager', 'restaurant_manager'];

// Addon Groups
router.get('/addon-groups', protect, groupController.getAddonGroups);
router.post('/addon-groups', protect, authorize(...managers), groupController.createAddonGroup);
router.delete('/addon-groups/:id', protect, authorize(...managers), groupController.deleteAddonGroup);

// Variation Groups
router.get('/variation-groups', protect, groupController.getVariationGroups);
router.post('/variation-groups', protect, authorize(...managers), groupController.createVariationGroup);
router.put('/variation-groups/:id', protect, authorize(...managers), groupController.updateVariationGroup);
router.delete('/variation-groups/:id', protect, authorize(...managers), groupController.deleteVariationGroup);

// Assignment
router.post('/assign-groups', protect, authorize(...managers), groupController.assignGroupsToItem);

module.exports = router;
