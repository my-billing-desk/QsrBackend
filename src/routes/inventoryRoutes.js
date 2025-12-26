const express = require('express');
const router = express.Router();
const InventoryController = require('../controllers/InventoryController');

const { protect } = require('../middleware/authMiddleware');

// Raw Materials
router.get('/materials', protect, InventoryController.getRawMaterials);
router.get('/materials/:id', protect, InventoryController.getRawMaterialById);
router.post('/materials', protect, InventoryController.createRawMaterial);
router.put('/materials/:id', protect, InventoryController.updateRawMaterial);
router.delete('/materials/:id', protect, InventoryController.deleteRawMaterial);

// Recipes
router.get('/recipes', protect, InventoryController.getRecipes);
router.get('/recipe', protect, InventoryController.getRecipeByItem); // ?itemId=1
router.post('/recipes', protect, InventoryController.saveRecipe);
router.delete('/recipes/:id', protect, InventoryController.deleteRecipe);

// Procurement
router.get('/suppliers', protect, InventoryController.getSuppliers);
router.post('/suppliers', protect, InventoryController.createSupplier);

router.get('/purchases', protect, InventoryController.getPurchases);
router.post('/purchases', protect, InventoryController.createPurchase);

router.get('/orders', protect, InventoryController.getPurchaseOrders);
router.post('/orders', protect, InventoryController.createPurchaseOrder);
router.post('/orders/:id/receive', protect, InventoryController.receivePurchaseOrder);

router.get('/returns', protect, InventoryController.getPurchaseReturns);
router.post('/returns', protect, InventoryController.createPurchaseReturn);

// Stats
router.get('/stats', protect, InventoryController.getInventoryStats);
router.post('/closing-stock', protect, InventoryController.updateClosingStock);
router.get('/reports/closing-stock', protect, InventoryController.getClosingStockReport);
router.get('/reports/stock-summary', protect, InventoryController.getStockSummaryReport); // New Endpoint
router.get('/reports/order-consumption', protect, InventoryController.getOrderWiseConsumptionReport); // New Endpoint
router.get('/reports/consumption-summary', protect, InventoryController.getConsumptionSummaryReport); // New Endpoint

// Wastage
router.get('/wastage', protect, InventoryController.getWastages);
router.post('/wastage', protect, InventoryController.createWastage);

module.exports = router;
