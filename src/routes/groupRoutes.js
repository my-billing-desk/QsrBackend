const express = require('express');
const router = express.Router();
const groupController = require('../controllers/GroupController');

const { protect } = require('../middleware/authMiddleware');

// Addon Groups
router.get('/addon-groups', protect, groupController.getAddonGroups);
router.post('/addon-groups', protect, groupController.createAddonGroup);
router.delete('/addon-groups/:id', protect, groupController.deleteAddonGroup);

// Variation Groups
router.get('/variation-groups', protect, groupController.getVariationGroups);
router.post('/variation-groups', protect, groupController.createVariationGroup);
router.put('/variation-groups/:id', protect, groupController.updateVariationGroup);
router.delete('/variation-groups/:id', protect, groupController.deleteVariationGroup);

// Assignment
router.post('/assign-groups', protect, groupController.assignGroupsToItem);

module.exports = router;
