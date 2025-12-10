const { RawMaterial, Recipe, RecipeIngredient, Item, Variant } = require('../models');

// --- Raw Materials ---

exports.getRawMaterials = async (req, res) => {
    try {
        const materials = await RawMaterial.findAll({
            order: [['name', 'ASC']]
        });
        res.json(materials);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createRawMaterial = async (req, res) => {
    try {
        const material = await RawMaterial.create(req.body);
        res.status(201).json(material);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.updateRawMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const [updated] = await RawMaterial.update(req.body, { where: { id } });
        if (updated) {
            const updatedMaterial = await RawMaterial.findByPk(id);
            res.json(updatedMaterial);
        } else {
            res.status(404).json({ error: 'Raw Material not found' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteRawMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        await RawMaterial.destroy({ where: { id } });
        res.json({ message: 'Raw Material deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- Recipes ---

exports.getRecipes = async (req, res) => {
    try {
        // Build a recipe list. It might be Items that HAVE recipes.
        // Or just listing the Recipe table.
        // The screenshot implies viewing items and checking if they have recipes.

        // Let's return recipes with included item details
        const recipes = await Recipe.findAll({
            include: [
                { model: Item, attributes: ['id', 'name'] },
                { model: Variant, attributes: ['id', 'name'] },
                { model: RecipeIngredient, include: [RawMaterial] }
            ]
        });
        res.json(recipes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getRecipeByItem = async (req, res) => {
    try {
        const { itemId, variantId } = req.query;
        if (!itemId && !variantId) return res.status(400).json({ error: 'itemId or variantId required' });

        const whereClause = {};
        if (itemId) whereClause.itemId = itemId;
        if (variantId) whereClause.variantId = variantId;

        const recipe = await Recipe.findOne({
            where: whereClause,
            include: [
                { model: RecipeIngredient, include: [RawMaterial] }
            ]
        });

        if (!recipe) return res.status(404).json({ message: 'No recipe found' });
        res.json(recipe);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.saveRecipe = async (req, res) => {
    try {
        const { itemId, variantId, yieldQty, instructions, ingredients } = req.body;
        // ingredients: [{ rawMaterialId, quantity, unit, ... }]

        // Check for existing recipe
        const whereClause = {};
        if (itemId) whereClause.itemId = itemId;
        if (variantId) whereClause.variantId = variantId;

        let recipe = await Recipe.findOne({ where: whereClause });

        if (recipe) {
            // Update
            await recipe.update({ yieldQty, instructions });
            // Replace ingredients
            await RecipeIngredient.destroy({ where: { recipeId: recipe.id } });
        } else {
            // Create
            recipe = await Recipe.create({ itemId, variantId, yieldQty, instructions });
        }

        if (ingredients && ingredients.length > 0) {
            const ingredientPromises = ingredients.map(ing => RecipeIngredient.create({
                recipeId: recipe.id,
                rawMaterialId: ing.rawMaterialId,
                quantity: ing.quantity,
                unit: ing.unit,
                wastagePercent: ing.wastagePercent
            }));
            await Promise.all(ingredientPromises);
        }

        const completeRecipe = await Recipe.findByPk(recipe.id, {
            include: [{ model: RecipeIngredient, include: [RawMaterial] }]
        });

        res.json(completeRecipe);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
// --- Suppliers ---

exports.getSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.findAll();
        res.json(suppliers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.create(req.body);
        res.status(201).json(supplier);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// --- Purchases ---

exports.getPurchases = async (req, res) => {
    try {
        const purchases = await Purchase.findAll({
            include: [
                { model: Supplier },
                { model: PurchaseItem, include: [RawMaterial] }
            ]
        });
        res.json(purchases);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createPurchase = async (req, res) => {
    try {
        const { items, ...purchaseData } = req.body;

        const purchase = await Purchase.create(purchaseData);

        if (items && items.length > 0) {
            const itemPromises = items.map(async item => {
                // Add item to purchase
                await PurchaseItem.create({
                    ...item,
                    purchaseId: purchase.id
                });

                // Update Raw Material Stock
                const rawMaterial = await RawMaterial.findByPk(item.rawMaterialId);
                if (rawMaterial) {
                    await rawMaterial.increment('currentStock', { by: parseFloat(item.quantity) });
                    // Optionally update purchase price
                    if (item.price > 0) {
                        await rawMaterial.update({ purchasePrice: item.price });
                    }
                }
            });
            await Promise.all(itemPromises);
        }

        const completePurchase = await Purchase.findByPk(purchase.id, {
            include: [{ model: PurchaseItem }]
        });
        res.status(201).json(completePurchase);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// --- Purchase Orders ---

exports.getPurchaseOrders = async (req, res) => {
    try {
        const orders = await PurchaseOrder.findAll({
            include: [
                { model: Supplier },
                { model: PurchaseOrderItem, include: [RawMaterial] }
            ]
        });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createPurchaseOrder = async (req, res) => {
    try {
        const { items, ...poData } = req.body;
        const po = await PurchaseOrder.create(poData);

        if (items && items.length > 0) {
            const itemPromises = items.map(item => PurchaseOrderItem.create({
                ...item,
                purchaseOrderId: po.id
            }));
            await Promise.all(itemPromises);
        }

        res.status(201).json(po);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// --- Purchase Returns ---

exports.getPurchaseReturns = async (req, res) => {
    try {
        const returns = await PurchaseReturn.findAll({
            include: [
                { model: Supplier },
                { model: PurchaseReturnItem, include: [RawMaterial] }
            ]
        });
        res.json(returns);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createPurchaseReturn = async (req, res) => {
    try {
        const { items, ...prData } = req.body;
        const pr = await PurchaseReturn.create(prData);

        if (items && items.length > 0) {
            const itemPromises = items.map(async item => {
                await PurchaseReturnItem.create({
                    ...item,
                    purchaseReturnId: pr.id
                });
                // Deduct Stock
                const rawMaterial = await RawMaterial.findByPk(item.rawMaterialId);
                if (rawMaterial) {
                    await rawMaterial.decrement('currentStock', { by: parseFloat(item.quantity) });
                }
            });
            await Promise.all(itemPromises);
        }
        res.status(201).json(pr);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// --- Dashboard Stats ---

exports.getInventoryStats = async (req, res) => {
    try {
        const materials = await RawMaterial.findAll();
        const lowStock = materials.filter(m => m.currentStock <= m.minStockLevel).length;

        let totalValue = 0;
        materials.forEach(m => {
            totalValue += (m.currentStock * m.purchasePrice);
        });

        res.json({
            totalItems: materials.length,
            lowStockCount: lowStock,
            totalStockValue: totalValue,
            totalWastage: 450 // Mock for now
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
// --- Wastage Management ---

exports.getWastages = async (req, res) => {
    try {
        const wastages = await Wastage.findAll({
            include: [
                { model: WastageItem, include: [RawMaterial, Item] }
            ],
            order: [['date', 'DESC']]
        });
        res.json(wastages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createWastage = async (req, res) => {
    try {
        const { items, ...wastageData } = req.body;
        const wastage = await Wastage.create(wastageData);

        if (items && items.length > 0) {
            const itemPromises = items.map(async item => {
                await WastageItem.create({
                    ...item,
                    wastageId: wastage.id
                });

                // Deduct from Stock (similar to Return/Consumption)
                if (item.rawMaterialId) {
                    const material = await RawMaterial.findByPk(item.rawMaterialId);
                    if (material) {
                        await material.decrement('currentStock', { by: parseFloat(item.quantity) });
                    }
                }
            });
            await Promise.all(itemPromises);
        }

        const completeWastage = await Wastage.findByPk(wastage.id, {
            include: [{ model: WastageItem }]
        });
        res.status(201).json(completeWastage);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
