const {
    RawMaterial, Recipe, RecipeIngredient, Item, Variant,
    Supplier, Purchase, PurchaseItem, PurchaseOrder, PurchaseOrderItem,
    PurchaseReturn, PurchaseReturnItem, Wastage, WastageItem, sequelize,
    Order, OrderItem // Imported for consumption reports
} = require('../models');
const { Op } = require('sequelize');

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

exports.getRawMaterialById = async (req, res) => {
    try {
        const { id } = req.params;
        const material = await RawMaterial.findByPk(id);
        if (!material) {
            return res.status(404).json({ error: 'Raw Material not found' });
        }
        res.json(material);
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
        const { itemId, variantId, yieldQty, instructions, ingredients, autoConsumption } = req.body;
        // ingredients: [{ rawMaterialId, quantity, unit, ... }]

        // Check for existing recipe
        const whereClause = {};
        if (itemId) whereClause.itemId = itemId;
        if (variantId) whereClause.variantId = variantId;

        let recipe = await Recipe.findOne({ where: whereClause });

        if (recipe) {
            // Update
            await recipe.update({ yieldQty, instructions, autoConsumption });
            // Replace ingredients
            await RecipeIngredient.destroy({ where: { recipeId: recipe.id } });
        } else {
            // Create
            recipe = await Recipe.create({ itemId, variantId, yieldQty, instructions, autoConsumption });
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

exports.deleteRecipe = async (req, res) => {
    try {
        const { id } = req.params;
        const recipe = await Recipe.findByPk(id);
        if (!recipe) {
            return res.status(404).json({ error: 'Recipe not found' });
        }
        await RecipeIngredient.destroy({ where: { recipeId: id } });
        await recipe.destroy();
        res.json({ message: 'Recipe deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
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

exports.receivePurchaseOrder = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { items, invoiceNumber, invoiceDate } = req.body; // Items with receivedQty and price

        const po = await PurchaseOrder.findByPk(id);
        if (!po) {
            await t.rollback();
            return res.status(404).json({ error: 'Purchase Order not found' });
        }

        if (po.status === 'Received') {
            await t.rollback();
            return res.status(400).json({ error: 'PO already received' });
        }

        // Update PO Status
        await po.update({ status: 'Received', deliveryDate: new Date() }, { transaction: t });

        // Create a definitive Purchase Record (GRN)
        const purchase = await Purchase.create({
            supplierId: po.supplierId,
            invoiceNumber: invoiceNumber || `PO-${po.poNumber}`,
            invoiceDate: invoiceDate || new Date(),
            totalAmount: items.reduce((sum, item) => sum + (item.quantity * item.price), 0), // Calc total
            status: 'Completed'
        }, { transaction: t });

        // Process Items
        if (items && items.length > 0) {
            for (const item of items) {
                // Update PO Item (Received Qty)
                await PurchaseOrderItem.update(
                    { quantityReceived: item.quantity, price: item.price, amount: item.quantity * item.price },
                    { where: { purchaseOrderId: id, rawMaterialId: item.rawMaterialId }, transaction: t }
                );

                // Add to Purchase Record
                await PurchaseItem.create({
                    purchaseId: purchase.id,
                    rawMaterialId: item.rawMaterialId,
                    quantity: item.quantity,
                    unit: item.unit,
                    price: item.price,
                    amount: item.quantity * item.price
                }, { transaction: t });

                // Update Stock
                const material = await RawMaterial.findByPk(item.rawMaterialId);
                if (material) {
                    await material.increment('currentStock', { by: parseFloat(item.quantity), transaction: t });
                    // Update latest purchase price
                    await material.update({ purchasePrice: item.price }, { transaction: t });
                }
            }
        }

        await t.commit();
        res.json({ message: 'PO Received and Stock Updated', purchase });
    } catch (error) {
        if (!t.finished) await t.rollback();
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

exports.getClosingStockReport = async (req, res) => {
    try {
        const materials = await RawMaterial.findAll({
            order: [['name', 'ASC']]
        });

        // Return current closing stock
        const report = materials.map(m => ({
            id: m.id,
            name: m.name,
            unit: m.unit,
            closingStock: m.currentStock,
            price: m.purchasePrice,
            value: (m.currentStock * m.purchasePrice).toFixed(2)
        }));

        res.json(report);
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

// --- Report Aggregations ---

// 1. Stock Summary Report (Daily Report)
exports.getStockSummaryReport = async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;

        // Date filters
        const dateFilter = {};
        if (fromDate && toDate) {
            dateFilter.createdAt = { [Op.between]: [new Date(fromDate), new Date(toDate + 'T23:59:59')] };
        } else {
            // Default to today if not specified, to handle "current" view logic
            const start = new Date(); start.setHours(0, 0, 0, 0);
            const end = new Date(); end.setHours(23, 59, 59, 999);
            dateFilter.createdAt = { [Op.between]: [start, end] };
        }

        const materials = await RawMaterial.findAll();

        // 1. Calculate Purchases in Range
        const purchases = await PurchaseItem.findAll({
            where: dateFilter,
            attributes: ['rawMaterialId', 'quantity']
        });
        const purchaseMap = {};
        purchases.forEach(p => {
            purchaseMap[p.rawMaterialId] = (purchaseMap[p.rawMaterialId] || 0) + p.quantity;
        });

        // 2. Calculate Consumption in Range
        // We fetch Orders -> Items -> Recipe -> Ingredients
        // Note: This is computationally heavy for large datasets. Optimization: "ConsumptionLog" table.
        const orders = await Order.findAll({
            where: dateFilter,
            include: [{
                model: OrderItem,
                as: 'items',
                include: [{
                    model: Item,
                    include: [{
                        model: Recipe,
                        where: { isActive: true },
                        required: false,
                        include: [{ model: RecipeIngredient }]
                    }]
                }]
            }]
        });

        const consumedMap = {};
        orders.forEach(order => {
            if (order.items) {
                order.items.forEach(orderItem => {
                    const item = orderItem.Item;
                    const recipe = item?.Recipe;

                    // Only count if recipe exists AND autoConsumption is ON
                    // This matches the logic in OrderController.consumeStock
                    if (recipe && recipe.RecipeIngredients && recipe.autoConsumption !== false) {
                        recipe.RecipeIngredients.forEach(ing => {
                            const totalQty = (ing.quantity / (recipe.yieldQty || 1)) * orderItem.quantity;
                            consumedMap[ing.rawMaterialId] = (consumedMap[ing.rawMaterialId] || 0) + totalQty;
                        });
                    }
                });
            }
        });

        // 3. Build Report
        const report = materials.map(m => {
            const purchaseQty = purchaseMap[m.id] || 0;
            const consumedQty = consumedMap[m.id] || 0;
            const currentStock = m.currentStock; // This is the state at END of period (approximately)

            // Back-calculate Opening
            // Closing = Opening + Purchase - Consumed
            // => Opening = Closing - Purchase + Consumed
            const openingStock = currentStock - purchaseQty + consumedQty;

            return {
                id: m.id,
                name: m.name,
                unit: m.consumptionUnit,
                opening: openingStock,
                purchase: purchaseQty,
                excess: 0,
                totalInput: openingStock + purchaseQty,
                consumed: consumedQty,
                wastage: 0,
                normalLoss: 0,
                transfer: 0,
                shortage: 0,
                conversion: 0,
                totalOutput: consumedQty, // + wastage etc
                closingStock: currentStock, // Actual
                closingSummary: currentStock,
                difference: 0
            };
        });

        res.json(report);
    } catch (error) {
        console.error("Stock Summary Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// 2. Orderwise Consumption Report
exports.getOrderWiseConsumptionReport = async (req, res) => {
    try {
        // Fetch Orders with Items
        const orders = await Order.findAll({
            include: [
                {
                    model: OrderItem,
                    include: [
                        {
                            model: Item,
                            include: [
                                {
                                    model: Recipe,
                                    include: [{ model: RecipeIngredient, include: [RawMaterial] }]
                                }
                            ]
                        }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: 5 // Limit for performance in this view
        });

        const reportOrders = orders.map(order => {
            let totalCost = 0;
            const items = order.OrderItems.map(orderItem => {
                const item = orderItem.Item;
                const recipe = item?.Recipes?.[0]; // Assuming 1 recipe per item for now

                const ingredients = recipe ? recipe.RecipeIngredients.map(ri => {
                    const cost = ri.quantity * (ri.RawMaterial?.purchasePrice || 0) * orderItem.quantity;
                    totalCost += cost;
                    return {
                        name: ri.RawMaterial?.name,
                        qty: `${ri.quantity * orderItem.quantity} ${ri.unit}`,
                        cost: cost
                    };
                }) : [];

                return {
                    name: item.name,
                    qty: orderItem.quantity,
                    price: orderItem.price * orderItem.quantity,
                    ingredients
                };
            });

            const profit = order.totalAmount - totalCost;
            const profitPercent = order.totalAmount > 0 ? (profit / order.totalAmount) * 100 : 0;

            return {
                orderNo: order.orderNumber,
                date: order.createdAt,
                totalPrice: order.totalAmount,
                profitPercent: profitPercent.toFixed(2),
                cogs: totalCost,
                items
            };
        });

        // Summary Stats
        const totalSales = reportOrders.reduce((Acc, o) => Acc + o.totalPrice, 0);
        const totalCOGS = reportOrders.reduce((Acc, o) => Acc + o.cogs, 0);

        res.json({
            summary: {
                totalSales,
                totalCost: totalCOGS,
                profitPercent: totalSales > 0 ? ((totalSales - totalCOGS) / totalSales) * 100 : 0
            },
            orders: reportOrders
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// 3. Consumption Summary Report
exports.getConsumptionSummaryReport = async (req, res) => {
    try {
        // Aggregate all consumption from Orders -> OrderItems -> Recipes -> Ingredients
        const materials = await RawMaterial.findAll();

        // In a real optimized query, we would use Sequelize.fn('SUM') with joins.
        // For MVP, we pass basic material info and would calculate usage on the fly or via a separate 'ConsumptionLog' table.
        // We will return materials with their current purchase price for the report grid.

        const report = materials.map(m => ({
            id: m.id,
            name: m.name,
            unit: m.consumptionUnit,
            date: new Date(),
            consumption: 0, // Needs aggregation
            price: m.purchasePrice,
            cost: 0
        }));

        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
