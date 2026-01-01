const express = require('express');
const router = express.Router();
const InventoryController = require('../controllers/InventoryController');

const { protect, authorize } = require('../middleware/authMiddleware');

const managers = ['super_admin', 'admin', 'zone_manager', 'area_manager', 'city_manager', 'restaurant_manager'];

// Raw Materials
router.get('/materials', protect, authorize(...managers), InventoryController.getRawMaterials);
router.get('/materials/:id', protect, authorize(...managers), InventoryController.getRawMaterialById);
router.post('/materials', protect, authorize(...managers), InventoryController.createRawMaterial);
router.put('/materials/:id', protect, authorize(...managers), InventoryController.updateRawMaterial);
router.delete('/materials/:id', protect, authorize(...managers), InventoryController.deleteRawMaterial);

// Recipes
router.get('/recipes', protect, authorize(...managers), InventoryController.getRecipes);
router.get('/recipe', protect, authorize(...managers), InventoryController.getRecipeByItem); // ?itemId=1
router.post('/recipes', protect, authorize(...managers), InventoryController.saveRecipe);
router.delete('/recipes/:id', protect, authorize(...managers), InventoryController.deleteRecipe);

// Procurement
router.get('/suppliers', protect, authorize(...managers), InventoryController.getSuppliers);
router.post('/suppliers', protect, authorize(...managers), InventoryController.createSupplier);

router.get('/purchases', protect, authorize(...managers), InventoryController.getPurchases);
router.post('/purchases', protect, authorize(...managers), InventoryController.createPurchase);

router.get('/orders', protect, authorize(...managers), InventoryController.getPurchaseOrders);
router.post('/orders', protect, authorize(...managers), InventoryController.createPurchaseOrder);
router.post('/orders/:id/receive', protect, authorize(...managers), InventoryController.receivePurchaseOrder);

router.get('/returns', protect, authorize(...managers), InventoryController.getPurchaseReturns);
router.post('/returns', protect, authorize(...managers), InventoryController.createPurchaseReturn);

// Stats
router.get('/stats', protect, authorize(...managers), InventoryController.getInventoryStats);
router.post('/closing-stock', protect, authorize(...managers), InventoryController.updateClosingStock);
router.get('/reports/closing-stock', protect, authorize(...managers), InventoryController.getClosingStockReport);
router.get('/reports/stock-summary', protect, authorize(...managers), InventoryController.getStockSummaryReport); // New Endpoint
router.get('/reports/order-consumption', protect, authorize(...managers), InventoryController.getOrderWiseConsumptionReport); // New Endpoint
router.get('/reports/consumption-summary', protect, authorize(...managers), InventoryController.getConsumptionSummaryReport); // New Endpoint
router.get('/reports/stock-history', protect, authorize(...managers), InventoryController.getStockHistoryReport); // New Endpoint

// Wastage
router.get('/wastage', protect, authorize(...managers), InventoryController.getWastages);
router.post('/wastage', protect, authorize(...managers), InventoryController.createWastage);

module.exports = router;
