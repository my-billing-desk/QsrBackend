const express = require('express');
const router = express.Router();
const groupController = require('../controllers/GroupController');

// Addon Groups
router.get('/addon-groups', groupController.getAddonGroups);
router.post('/addon-groups', groupController.createAddonGroup);
router.delete('/addon-groups/:id', groupController.deleteAddonGroup);

// Variation Groups
router.get('/variation-groups', groupController.getVariationGroups);
router.post('/variation-groups', groupController.createVariationGroup);
router.put('/variation-groups/:id', groupController.updateVariationGroup);
router.delete('/variation-groups/:id', groupController.deleteVariationGroup);

// Assignment
router.post('/assign-groups', groupController.assignGroupsToItem);

module.exports = router;
