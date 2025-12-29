const { RawMaterial, Recipe, RecipeIngredient, StockTransaction, Item, Variant, sequelize } = require('../models');

/**
 * Inventory Deduction Service
 * Automatically deducts ingredients when orders are created
 */

class InventoryDeductionService {
    /**
     * Deduct inventory for an entire order
     * @param {Object} order - Order object with items
     * @param {number} userId - User creating the order
     * @returns {Promise<Object>} - Deduction results
     */
    async deductInventoryForOrder(order, userId) {
        const transaction = await sequelize.transaction();

        try {
            const results = {
                success: true,
                deductions: [],
                warnings: [],
                errors: []
            };

            for (const orderItem of order.items) {
                const deduction = await this.deductInventoryForItem(
                    orderItem.itemId,
                    orderItem.variantId,
                    orderItem.quantity,
                    order.id,
                    userId,
                    transaction
                );

                results.deductions.push(deduction);

                if (deduction.lowStockWarnings) {
                    results.warnings.push(...deduction.lowStockWarnings);
                }
            }

            await transaction.commit();
            return results;
        } catch (error) {
            await transaction.rollback();
            console.error('Error deducting inventory:', error);
            throw error;
        }
    }

    /**
     * Deduct inventory for a single item
     * @param {number} itemId - Item ID
     * @param {number} variantId - Variant ID (optional)
     * @param {number} quantity - Quantity ordered
     * @param {number} orderId - Order ID for tracking
     * @param {number} userId - User ID
     * @param {Object} transaction - Database transaction
     * @returns {Promise<Object>} - Deduction details
     */
    async deductInventoryForItem(itemId, variantId, quantity, orderId, userId, transaction) {
        // Find the recipe for this item/variant
        const recipe = await Recipe.findOne({
            where: variantId ? { variantId } : { itemId },
            include: [
                {
                    model: RecipeIngredient,
                    include: [RawMaterial]
                }
            ],
            transaction
        });

        if (!recipe || !recipe.RecipeIngredients || recipe.RecipeIngredients.length === 0) {
            // No recipe defined, skip deduction
            return {
                itemId,
                variantId,
                quantity,
                message: 'No recipe defined, skipping inventory deduction'
            };
        }

        const deductions = [];
        const lowStockWarnings = [];

        // Deduct each ingredient
        for (const recipeIngredient of recipe.RecipeIngredients) {
            const rawMaterial = recipeIngredient.RawMaterial;
            const quantityNeeded = recipeIngredient.quantity * quantity;

            // Check current stock
            if (rawMaterial.currentStock < quantityNeeded) {
                lowStockWarnings.push({
                    rawMaterialId: rawMaterial.id,
                    rawMaterialName: rawMaterial.name,
                    needed: quantityNeeded,
                    available: rawMaterial.currentStock,
                    shortage: quantityNeeded - rawMaterial.currentStock
                });
            }

            // Deduct from stock
            const newStock = Math.max(0, rawMaterial.currentStock - quantityNeeded);

            await rawMaterial.update({
                currentStock: newStock
            }, { transaction });

            // Record stock transaction
            await StockTransaction.create({
                type: 'order',
                rawMaterialId: rawMaterial.id,
                quantityChange: -quantityNeeded,
                currentStock: newStock,
                orderId,
                performedBy: userId,
                tenantId: rawMaterial.tenantId,
                notes: `Order #${orderId} - ${quantity}x ${recipe.Item?.name || recipe.Variant?.name}`
            }, { transaction });

            deductions.push({
                rawMaterialId: rawMaterial.id,
                rawMaterialName: rawMaterial.name,
                quantityDeducted: quantityNeeded,
                unit: recipeIngredient.unit,
                newStock: newStock
            });

            // Check if we need to alert for low stock
            if (newStock <= rawMaterial.minStockLevel && rawMaterial.minStockLevel > 0) {
                lowStockWarnings.push({
                    rawMaterialId: rawMaterial.id,
                    rawMaterialName: rawMaterial.name,
                    currentStock: newStock,
                    minStock: rawMaterial.minStockLevel,
                    message: `${rawMaterial.name} is below minimum stock level`
                });
            }
        }

        return {
            itemId,
            variantId,
            quantity,
            deductions,
            lowStockWarnings: lowStockWarnings.length > 0 ? lowStockWarnings : null
        };
    }

    /**
     * Record waste/spillage
     * @param {number} rawMaterialId - Raw material ID
     * @param {number} quantity - Quantity wasted
     * @param {string} reason - Reason for waste
     * @param {number} userId - User recording waste
     * @param {string} tenantId - Tenant ID
     * @returns {Promise<Object>} - Waste record
     */
    async recordWaste(rawMaterialId, quantity, reason, userId, tenantId) {
        const transaction = await sequelize.transaction();

        try {
            const rawMaterial = await RawMaterial.findByPk(rawMaterialId, { transaction });

            if (!rawMaterial) {
                throw new Error('Raw material not found');
            }

            const newStock = Math.max(0, rawMaterial.currentStock - quantity);

            await rawMaterial.update({
                currentStock: newStock
            }, { transaction });

            const wasteRecord = await StockTransaction.create({
                type: 'waste',
                rawMaterialId,
                quantityChange: -quantity,
                currentStock: newStock,
                performedBy: userId,
                tenantId,
                notes: reason
            }, { transaction });

            await transaction.commit();

            return {
                success: true,
                wasteRecord,
                newStock
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Manual stock adjustment
     * @param {number} rawMaterialId - Raw material ID
     * @param {number} newQuantity - New stock quantity
     * @param {string} reason - Reason for adjustment
     * @param {number} userId - User making adjustment
     * @param {string} tenantId - Tenant ID
     * @returns {Promise<Object>} - Adjustment record
     */
    async adjustStock(rawMaterialId, newQuantity, reason, userId, tenantId) {
        const transaction = await sequelize.transaction();

        try {
            const rawMaterial = await RawMaterial.findByPk(rawMaterialId, { transaction });

            if (!rawMaterial) {
                throw new Error('Raw material not found');
            }

            const quantityChange = newQuantity - rawMaterial.currentStock;

            await rawMaterial.update({
                currentStock: newQuantity
            }, { transaction });

            const adjustmentRecord = await StockTransaction.create({
                type: 'adjustment',
                rawMaterialId,
                quantityChange,
                currentStock: newQuantity,
                performedBy: userId,
                tenantId,
                notes: reason
            }, { transaction });

            await transaction.commit();

            return {
                success: true,
                adjustmentRecord,
                oldStock: rawMaterial.currentStock,
                newStock: newQuantity,
                change: quantityChange
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Get low stock items
     * @param {string} tenantId - Tenant ID
     * @returns {Promise<Array>} - List of low stock items
     */
    async getLowStockItems(tenantId) {
        const lowStockItems = await RawMaterial.findAll({
            where: {
                tenantId,
                currentStock: {
                    [sequelize.Op.lte]: sequelize.col('minStockLevel')
                }
            },
            attributes: [
                'id', 'name', 'currentStock', 'minStockLevel',
                'purchaseUnit', 'consumptionUnit'
            ]
        });

        return lowStockItems;
    }
}

module.exports = new InventoryDeductionService();
