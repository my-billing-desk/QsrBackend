const express = require('express');
const router = express.Router();
const controller = require('../controllers/MenuController');

router.get('/categories', controller.getCategories);
router.post('/categories', controller.createCategory);
router.delete('/categories/:id', controller.deleteCategory);

router.get('/items', controller.getItems);
router.post('/items', controller.createItem);
router.put('/items/:id', controller.updateItem);
router.delete('/items/:id', controller.deleteItem);
router.patch('/items/:id/status', controller.updateItemStatus);
router.post('/items/bulk-status', controller.updateBulkStatus);
router.post('/items/import-full', controller.importFullMenu);
router.post('/items/import-full', controller.importFullMenu);
router.get('/items/export', controller.exportFullMenu);
router.post('/reorder', controller.reorderMenuItems);

router.get('/variants', controller.getVariants);
router.post('/variants', controller.createVariant);
router.delete('/variants/:id', controller.deleteVariant);

router.get('/addons', controller.getAddons);
router.post('/addons', controller.createAddon);
router.delete('/addons/:id', controller.deleteAddon);

module.exports = router;
