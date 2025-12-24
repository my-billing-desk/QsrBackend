const express = require('express');
const router = express.Router();
const InventoryController = require('../controllers/InventoryController');

// Raw Materials
router.get('/materials', InventoryController.getRawMaterials);
router.get('/materials/:id', InventoryController.getRawMaterialById);
router.post('/materials', InventoryController.createRawMaterial);
router.put('/materials/:id', InventoryController.updateRawMaterial);
router.delete('/materials/:id', InventoryController.deleteRawMaterial);

// Recipes
router.get('/recipes', InventoryController.getRecipes);
router.get('/recipe', InventoryController.getRecipeByItem); // ?itemId=1
router.post('/recipes', InventoryController.saveRecipe);
router.delete('/recipes/:id', InventoryController.deleteRecipe);

// Procurement
router.get('/suppliers', InventoryController.getSuppliers);
router.post('/suppliers', InventoryController.createSupplier);

router.get('/purchases', InventoryController.getPurchases);
router.post('/purchases', InventoryController.createPurchase);

router.get('/orders', InventoryController.getPurchaseOrders);
router.post('/orders', InventoryController.createPurchaseOrder);
router.post('/orders/:id/receive', InventoryController.receivePurchaseOrder);

router.get('/returns', InventoryController.getPurchaseReturns);
router.post('/returns', InventoryController.createPurchaseReturn);

// Stats
router.get('/stats', InventoryController.getInventoryStats);
router.post('/closing-stock', InventoryController.updateClosingStock);
router.get('/reports/closing-stock', InventoryController.getClosingStockReport);
router.get('/reports/stock-summary', InventoryController.getStockSummaryReport); // New Endpoint
router.get('/reports/order-consumption', InventoryController.getOrderWiseConsumptionReport); // New Endpoint
router.get('/reports/consumption-summary', InventoryController.getConsumptionSummaryReport); // New Endpoint

// Wastage
router.get('/wastage', InventoryController.getWastages);
router.post('/wastage', InventoryController.createWastage);

module.exports = router;
