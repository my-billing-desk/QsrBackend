const express = require('express');
const router = express.Router();
const controller = require('../controllers/MenuController');
const upload = require('../middleware/upload');

const { protect, authorize } = require('../middleware/authMiddleware');

const menuManagers = ['super_admin', 'admin', 'zone_manager', 'area_manager', 'city_manager', 'restaurant_manager'];

router.get('/categories', protect, controller.getCategories);
router.post('/categories', protect, authorize(...menuManagers), controller.createCategory);
router.delete('/categories/:id', protect, authorize(...menuManagers), controller.deleteCategory);

router.get('/items', protect, controller.getItems);
router.post('/items', protect, authorize(...menuManagers), upload.single('image'), controller.createItem);
router.put('/items/:id', protect, authorize(...menuManagers), upload.single('image'), controller.updateItem);
router.delete('/items/:id', protect, authorize(...menuManagers), controller.deleteItem);
router.patch('/items/:id/status', protect, authorize(...menuManagers), controller.updateItemStatus);
router.post('/items/bulk-status', protect, authorize(...menuManagers), controller.updateBulkStatus);
router.post('/items/import-full', protect, authorize(...menuManagers), controller.importFullMenu);
router.get('/items/export', protect, authorize(...menuManagers), controller.exportFullMenu);
router.post('/reorder', protect, authorize(...menuManagers), controller.reorderMenuItems);

router.get('/variants', protect, controller.getVariants);
router.post('/variants', protect, authorize(...menuManagers), controller.createVariant);
router.delete('/variants/:id', protect, authorize(...menuManagers), controller.deleteVariant);

router.get('/addons', protect, controller.getAddons);
router.post('/addons', protect, authorize(...menuManagers), controller.createAddon);
router.delete('/addons/:id', protect, authorize(...menuManagers), controller.deleteAddon);

module.exports = router;
