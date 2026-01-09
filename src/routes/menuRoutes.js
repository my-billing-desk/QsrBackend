const express = require('express');
const router = express.Router();
const controller = require('../controllers/MenuController');
const upload = require('../middleware/upload');

const { protect } = require('../middleware/authMiddleware');

router.get('/categories', protect, controller.getCategories);
router.post('/categories', protect, controller.createCategory);
router.delete('/categories/:id', protect, controller.deleteCategory);

router.get('/items', protect, controller.getItems);
router.post('/items', protect, upload.single('image'), controller.createItem);
router.put('/items/:id', protect, upload.single('image'), controller.updateItem);
router.delete('/items/:id', protect, controller.deleteItem);
router.patch('/items/:id/status', protect, controller.updateItemStatus);
router.post('/items/bulk-status', protect, controller.updateBulkStatus);
router.post('/items/import-full', protect, controller.importFullMenu);
router.get('/items/export', protect, controller.exportFullMenu);
router.post('/reorder', protect, controller.reorderMenuItems);

router.get('/variants', protect, controller.getVariants);
router.post('/variants', protect, controller.createVariant);
router.delete('/variants/:id', protect, controller.deleteVariant);

router.get('/addons', protect, controller.getAddons);
router.post('/addons', protect, controller.createAddon);
router.delete('/addons/:id', protect, controller.deleteAddon);

module.exports = router;
