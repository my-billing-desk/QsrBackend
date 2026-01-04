const {
    RawMaterial, Recipe, RecipeIngredient, Item, Variant,
    Supplier, Purchase, PurchaseItem, PurchaseOrder, PurchaseOrderItem,
    PurchaseReturn, PurchaseReturnItem, Wastage, WastageItem, sequelize,
    Order, OrderItem, StockTransaction // Added StockTransaction
} = require('../models');
const { Op } = require('sequelize');
const { getTodayIST, getStartOfDayIST, getEndOfDayIST } = require('../utils/dateUtils');
const { logToFile } = require('../utils/logger');

// --- Raw Materials ---
exports.getRawMaterials = async (req, res) => {
    try {
        if (!req.tenantId) return res.status(400).json({ error: 'Tenant ID missing' });
        const materials = await RawMaterial.findAll({
            where: { tenantId: req.tenantId },
            order: [['name', 'ASC']]
        });
        res.json(materials);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getRawMaterialById = async (req, res) => {
    try {
        if (!req.tenantId) return res.status(400).json({ error: 'Tenant ID missing' });
        const { id } = req.params;
        const material = await RawMaterial.findOne({ where: { id, tenantId: req.tenantId } });
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
        if (!req.tenantId) return res.status(400).json({ error: 'Tenant ID missing' });
        const material = await RawMaterial.create({ ...req.body, tenantId: req.tenantId });
        res.status(201).json(material);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.updateRawMaterial = async (req, res) => {
    try {
        if (!req.tenantId) return res.status(400).json({ error: 'Tenant ID missing' });
        const { id } = req.params;
        const [updated] = await RawMaterial.update(req.body, { where: { id, tenantId: req.tenantId } });
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
        if (!req.tenantId) return res.status(400).json({ error: 'Tenant ID missing' });
        const { id } = req.params;
        const deleted = await RawMaterial.destroy({ where: { id, tenantId: req.tenantId } });
        if (!deleted) return res.status(404).json({ error: 'Raw Material not found' });
        res.json({ message: 'Raw Material deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- Recipes ---
exports.getRecipes = async (req, res) => {
    try {
        const recipes = await Recipe.findAll({
            where: { tenantId: req.tenantId },
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
        const whereClause = { tenantId: req.tenantId };
        if (itemId) whereClause.itemId = itemId;
        if (variantId) whereClause.variantId = variantId;
        const recipe = await Recipe.findOne({
            where: whereClause,
            include: [{ model: RecipeIngredient, include: [RawMaterial] }]
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
        const whereClause = { tenantId: req.tenantId };
        if (itemId) whereClause.itemId = itemId;
        if (variantId) whereClause.variantId = variantId;
        let recipe = await Recipe.findOne({ where: whereClause });
        if (recipe) {
            await recipe.update({ yieldQty, instructions, autoConsumption });
            await RecipeIngredient.destroy({ where: { recipeId: recipe.id } });
        } else {
            recipe = await Recipe.create({ itemId, variantId, yieldQty, instructions, autoConsumption, tenantId: req.tenantId });
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
        const recipe = await Recipe.findOne({ where: { id, tenantId: req.tenantId } });
        if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
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
        const suppliers = await Supplier.findAll({ where: { tenantId: req.tenantId } });
        res.json(suppliers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.create({ ...req.body, tenantId: req.tenantId });
        res.status(201).json(supplier);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// --- Purchases ---
exports.getPurchases = async (req, res) => {
    try {
        const purchases = await Purchase.findAll({
            where: { tenantId: req.tenantId },
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
    const t = await sequelize.transaction();
    try {
        const { items, ...purchaseData } = req.body;

        const calculatedTotal = (items.reduce((sum, item) => {
            const qty = parseFloat(item.quantity) || 0;
            const price = parseFloat(item.price) || 0;
            const discount = parseFloat(item.discount) || 0;
            const taxAmount = ((qty * price - discount) * (parseFloat(item.tax) || 0)) / 100;
            return sum + (qty * price) - discount + taxAmount;
        }, 0) + (parseFloat(purchaseData.otherCharges) || 0) + (parseFloat(purchaseData.deliveryCharges) || 0) + (parseFloat(purchaseData.totalIgst) || 0) - (parseFloat(purchaseData.discount) || 0)).toFixed(2);

        const purchase = await Purchase.create({
            ...purchaseData,
            grandTotal: purchaseData.grandTotal || calculatedTotal,
            tenantId: req.tenantId
        }, { transaction: t });

        if (items && items.length > 0) {
            for (const item of items) {
                await PurchaseItem.create({
                    ...item,
                    taxPercent: item.tax || 0,
                    purchaseId: purchase.id,
                    tenantId: req.tenantId
                }, { transaction: t });

                const rawMaterial = await RawMaterial.findByPk(item.rawMaterialId, { transaction: t });
                if (rawMaterial) {
                    const oldStock = rawMaterial.currentStock || 0;
                    const newStock = oldStock + parseFloat(item.quantity);
                    await rawMaterial.update({
                        currentStock: newStock,
                        purchasePrice: item.price > 0 ? item.price : rawMaterial.purchasePrice
                    }, { transaction: t });

                    await StockTransaction.create({
                        type: 'purchase',
                        rawMaterialId: rawMaterial.id,
                        quantityChange: parseFloat(item.quantity),
                        currentStock: newStock,
                        purchaseId: purchase.id,
                        tenantId: req.tenantId,
                        notes: `Purchase Inward - Inv: ${purchase.invoiceNumber}`
                    }, { transaction: t });
                }
            }
        }
        await t.commit();
        res.status(201).json(purchase);
    } catch (error) {
        if (!t.finished) await t.rollback();
        res.status(400).json({ error: error.message });
    }
};

exports.updatePurchase = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { items, ...purchaseData } = req.body;

        const purchase = await Purchase.findOne({
            where: { id, tenantId: req.tenantId },
            include: [{ model: PurchaseItem }]
        });

        if (!purchase) {
            await t.rollback();
            return res.status(404).json({ error: 'Purchase record not found' });
        }

        // 1. Reverse old stock impacts
        for (const oldItem of purchase.PurchaseItems) {
            const mat = await RawMaterial.findByPk(oldItem.rawMaterialId, { transaction: t });
            if (mat) {
                const revertedStock = (mat.currentStock || 0) - (parseFloat(oldItem.quantity) || 0);
                await mat.update({ currentStock: revertedStock }, { transaction: t });

                await StockTransaction.create({
                    type: 'adjustment',
                    rawMaterialId: mat.id,
                    quantityChange: -(parseFloat(oldItem.quantity) || 0),
                    currentStock: revertedStock,
                    tenantId: req.tenantId,
                    notes: `Stock Reversal for Purchase Edit: ${purchase.invoiceNumber}`
                }, { transaction: t });
            }
        }

        // 2. Delete old items
        await PurchaseItem.destroy({ where: { purchaseId: id }, transaction: t });

        // 3. Update purchase header
        const calculatedTotal = (items.reduce((sum, item) => {
            const qty = parseFloat(item.quantity) || 0;
            const price = parseFloat(item.price) || 0;
            const discount = parseFloat(item.discount) || 0;
            const taxAmount = ((qty * price - discount) * (parseFloat(item.tax) || 0)) / 100;
            return sum + (qty * price) - discount + taxAmount;
        }, 0) + (parseFloat(purchaseData.otherCharges) || 0) + (parseFloat(purchaseData.deliveryCharges) || 0) + (parseFloat(purchaseData.totalIgst) || 0) - (parseFloat(purchaseData.discount) || 0)).toFixed(2);

        await purchase.update({
            ...purchaseData,
            grandTotal: purchaseData.grandTotal || calculatedTotal
        }, { transaction: t });

        // 4. Create new items and apply new stock
        if (items && items.length > 0) {
            for (const item of items) {
                await PurchaseItem.create({
                    ...item,
                    taxPercent: item.tax || 0,
                    purchaseId: id,
                    tenantId: req.tenantId
                }, { transaction: t });

                const rawMaterial = await RawMaterial.findByPk(item.rawMaterialId, { transaction: t });
                if (rawMaterial) {
                    const oldStock = rawMaterial.currentStock || 0;
                    const newStock = oldStock + parseFloat(item.quantity);
                    await rawMaterial.update({
                        currentStock: newStock,
                        purchasePrice: item.price > 0 ? item.price : rawMaterial.purchasePrice
                    }, { transaction: t });

                    await StockTransaction.create({
                        type: 'purchase',
                        rawMaterialId: rawMaterial.id,
                        quantityChange: parseFloat(item.quantity),
                        currentStock: newStock,
                        purchaseId: id,
                        tenantId: req.tenantId,
                        notes: `Purchase Update - Inv: ${purchase.invoiceNumber}`
                    }, { transaction: t });
                }
            }
        }

        await t.commit();
        res.json({ message: 'Purchase updated successfully', purchase });
    } catch (error) {
        if (!t.finished) await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

exports.deletePurchase = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const purchase = await Purchase.findOne({
            where: { id, tenantId: req.tenantId },
            include: [{ model: PurchaseItem }]
        });

        if (!purchase) {
            await t.rollback();
            return res.status(404).json({ error: 'Purchase not found' });
        }

        // Reverse stock impacts
        if (purchase.PurchaseItems) {
            for (const item of purchase.PurchaseItems) {
                const mat = await RawMaterial.findByPk(item.rawMaterialId, { transaction: t });
                if (mat) {
                    const oldStock = mat.currentStock || 0;
                    const newStock = oldStock - (parseFloat(item.quantity) || 0);
                    await mat.update({ currentStock: newStock }, { transaction: t });

                    await StockTransaction.create({
                        type: 'adjustment',
                        rawMaterialId: mat.id,
                        quantityChange: -(parseFloat(item.quantity) || 0),
                        currentStock: newStock,
                        tenantId: req.tenantId,
                        notes: `Purchase Deleted - Reversal: ${purchase.invoiceNumber}`
                    }, { transaction: t });
                }
            }
        }

        await PurchaseItem.destroy({ where: { purchaseId: id }, transaction: t });
        await purchase.destroy({ transaction: t });

        await t.commit();
        res.json({ message: 'Purchase deleted successfully' });
    } catch (error) {
        if (!t.finished) await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

// --- Purchase Orders ---
exports.getPurchaseOrders = async (req, res) => {
    try {
        const orders = await PurchaseOrder.findAll({
            where: { tenantId: req.tenantId },
            include: [{ model: Supplier }, { model: PurchaseOrderItem, include: [RawMaterial] }]
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
        const {
            items, invoiceNumber, invoiceDate, paymentStatus, paidAmount,
            deliveryDate, deliveryTime, otherCharges, totalDiscount, otherTaxes, notes,
            paymentType, transactionNumber, deliveryCharges
        } = req.body;

        const po = await PurchaseOrder.findOne({ where: { id, tenantId: req.tenantId } });
        if (!po || po.status === 'Received') {
            await t.rollback();
            return res.status(po ? 400 : 404).json({ error: po ? 'PO already received' : 'Purchase Order not found' });
        }

        const calculatedSubTotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        const grandTotal = calculatedSubTotal - (parseFloat(totalDiscount) || 0) + (parseFloat(otherCharges) || 0) + (parseFloat(otherTaxes) || 0) + (parseFloat(deliveryCharges) || 0);

        await po.update({
            status: 'Received',
            deliveryDate: deliveryDate || new Date(),
            deliveryTime: deliveryTime || '12:00'
        }, { transaction: t });

        const purchase = await Purchase.create({
            supplierId: po.supplierId,
            invoiceNumber: invoiceNumber || po.poNumber,
            invoiceDate: invoiceDate || new Date(),
            poNumber: po.poNumber,
            subTotal: calculatedSubTotal,
            discount: totalDiscount || 0,
            otherCharges: otherCharges || 0,
            deliveryCharges: deliveryCharges || 0,
            grandTotal: grandTotal,
            paymentStatus: paymentStatus || 'Unpaid',
            status: 'Completed',
            paymentType: paymentType || 'Cash',
            transactionNumber: transactionNumber || '',
            notes: notes || '',
            tenantId: req.tenantId
        }, { transaction: t });

        if (items && items.length > 0) {
            for (const item of items) {
                await PurchaseItem.create({
                    purchaseId: purchase.id,
                    rawMaterialId: item.rawMaterialId,
                    quantity: item.quantity,
                    unit: item.unit,
                    price: item.price,
                    amount: item.amount,
                    taxPercent: item.tax || 0,
                    tenantId: req.tenantId
                }, { transaction: t });

                // Update Material Stock
                const material = await RawMaterial.findByPk(item.rawMaterialId);
                if (material) {
                    const oldStock = material.currentStock || 0;
                    const newStock = oldStock + parseFloat(item.quantity);

                    await material.update({
                        currentStock: newStock,
                        purchasePrice: item.price
                    }, { transaction: t });

                    // Log History
                    await StockTransaction.create({
                        type: 'purchase',
                        rawMaterialId: material.id,
                        quantityChange: parseFloat(item.quantity),
                        currentStock: newStock,
                        purchaseId: purchase.id,
                        tenantId: req.tenantId,
                        notes: `PO Received: ${po.poNumber}`
                    }, { transaction: t });
                }
            }
        }

        await t.commit();
        res.json({ message: 'Purchase Order successfully received and stock updated', purchase });
    } catch (error) {
        if (!t.finished) await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

exports.updatePurchaseOrder = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { items, ...poData } = req.body;

        const po = await PurchaseOrder.findOne({ where: { id, tenantId: req.tenantId } });
        if (!po) {
            await t.rollback();
            return res.status(404).json({ error: 'Purchase Order not found' });
        }

        await po.update(poData, { transaction: t });

        if (items) {
            await PurchaseOrderItem.destroy({ where: { purchaseOrderId: id }, transaction: t });
            for (const item of items) {
                await PurchaseOrderItem.create({
                    ...item,
                    purchaseOrderId: id,
                    tenantId: req.tenantId
                }, { transaction: t });
            }
        }

        await t.commit();
        res.json({ message: 'Purchase Order updated successfully' });
    } catch (error) {
        if (!t.finished) await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

exports.createPurchaseOrder = async (req, res) => {
    try {
        const { items, ...poData } = req.body;

        // Auto-generate PO Number if not provided
        if (!poData.poNumber) {
            const count = await PurchaseOrder.count({ where: { tenantId: req.tenantId } });
            poData.poNumber = `PO${(count + 1).toString().padStart(6, '0')}`;
        }

        const po = await PurchaseOrder.create({ ...poData, tenantId: req.tenantId });
        if (items && items.length > 0) {
            const itemPromises = items.map(item => PurchaseOrderItem.create({ ...item, purchaseOrderId: po.id, tenantId: req.tenantId }));
            await Promise.all(itemPromises);
        }
        res.status(201).json(po);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// --- Return, Stats, etc. (Truncated for brevity, but kept complete in the actual file)
exports.getPurchaseReturns = async (req, res) => {
    try {
        const returns = await PurchaseReturn.findAll({
            where: { tenantId: req.tenantId },
            include: [{ model: Supplier }, { model: PurchaseReturnItem, include: [RawMaterial] }]
        });
        res.json(returns);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createPurchaseReturn = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { items, ...prData } = req.body;
        const pr = await PurchaseReturn.create({ ...prData, tenantId: req.tenantId }, { transaction: t });
        if (items && items.length > 0) {
            for (const item of items) {
                await PurchaseReturnItem.create({ ...item, purchaseReturnId: pr.id, tenantId: req.tenantId }, { transaction: t });
                const rawMaterial = await RawMaterial.findByPk(item.rawMaterialId);
                if (rawMaterial) {
                    const oldStock = rawMaterial.currentStock;
                    const newStock = Math.max(0, oldStock - parseFloat(item.quantity));

                    await rawMaterial.update({ currentStock: newStock }, { transaction: t });

                    // Log History
                    await StockTransaction.create({
                        type: 'return',
                        rawMaterialId: rawMaterial.id,
                        quantityChange: -parseFloat(item.quantity),
                        currentStock: newStock,
                        tenantId: req.tenantId,
                        notes: `Purchase Return: ${pr.debitNoteNumber}`
                    }, { transaction: t });
                }
            }
        }
        await t.commit();
        res.status(201).json(pr);
    } catch (error) {
        if (!t.finished) await t.rollback();
        res.status(400).json({ error: error.message });
    }
};

exports.getInventoryStats = async (req, res) => {
    try {
        const materials = await RawMaterial.findAll({
            where: { tenantId: req.tenantId },
            order: [['currentStock', 'DESC']]
        });

        const lowStock = materials.filter(m => m.currentStock <= m.minStockLevel).length;
        let totalValue = materials.reduce((sum, m) => sum + ((parseFloat(m.currentStock) || 0) * (parseFloat(m.purchasePrice) || 0)), 0);

        const last30Days = new Date(); last30Days.setDate(last30Days.getDate() - 30);
        const wastages = await Wastage.findAll({
            where: { tenantId: req.tenantId, date: { [Op.gte]: last30Days } },
            include: [{ model: WastageItem, include: [RawMaterial] }]
        });

        let totalWastageValue = 0;
        wastages.forEach(w => w.WastageItems.forEach(wi => {
            const price = wi.price || wi.RawMaterial?.purchasePrice || 0;
            totalWastageValue += ((parseFloat(wi.quantity) || 0) * (parseFloat(price) || 0));
        }));

        const pendingOrdersCount = await PurchaseOrder.count({
            where: { tenantId: req.tenantId, status: 'Pending' }
        });

        const recentTransactions = await StockTransaction.findAll({
            where: { tenantId: req.tenantId },
            include: [{ model: RawMaterial, attributes: ['name'] }],
            order: [['createdAt', 'DESC']],
            limit: 5
        });

        res.json({
            totalItems: materials.length,
            lowStockCount: lowStock,
            totalStockValue: totalValue.toFixed(2),
            totalWastage: totalWastageValue.toFixed(2),
            pendingOrders: pendingOrdersCount,
            recentActivity: recentTransactions.map(t => ({
                id: t.id,
                name: t.RawMaterial?.name || 'Unknown Item',
                type: t.type.charAt(0).toUpperCase() + t.type.slice(1),
                qty: `${t.quantityChange > 0 ? '+' : ''}${t.quantityChange}`,
                time: t.createdAt,
                notes: t.notes
            })),
            marginGap: 2.1 // Can be calculated from actual consumption later
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getClosingStockReport = async (req, res) => {
    try {
        const materials = await RawMaterial.findAll({ where: { tenantId: req.tenantId }, order: [['name', 'ASC']] });
        res.json(materials.map(m => ({ id: m.id, name: m.name, unit: m.unit, closingStock: m.currentStock, price: m.purchasePrice, value: (m.currentStock * m.purchasePrice).toFixed(2) })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getWastages = async (req, res) => {
    try {
        const wastages = await Wastage.findAll({ where: { tenantId: req.tenantId }, include: [{ model: WastageItem, include: [RawMaterial, Item] }], order: [['date', 'DESC']] });
        res.json(wastages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createWastage = async (req, res) => {
    try {
        const { items, ...wastageData } = req.body;
        const wastage = await Wastage.create({ ...wastageData, tenantId: req.tenantId });
        if (items && items.length > 0) {
            await Promise.all(items.map(async item => {
                await WastageItem.create({ ...item, wastageId: wastage.id });
                if (item.rawMaterialId) {
                    const material = await RawMaterial.findByPk(item.rawMaterialId);
                    if (material) await material.decrement('currentStock', { by: parseFloat(item.quantity) });
                }
            }));
        }
        res.status(201).json(await Wastage.findByPk(wastage.id, { include: [{ model: WastageItem }] }));
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// --- STOCK SUMMARY REPORT (REWRITTEN FOR ROBUSTNESS) ---
exports.getStockSummaryReport = async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;
        console.log(`[STOCK SUMMARY] Request received. Tenant: ${req.tenantId}, From: ${fromDate}, To: ${toDate}`);
        const dateFilter = { tenantId: req.tenantId };
        if (fromDate && toDate) {
            dateFilter.createdAt = { [Op.between]: [getStartOfDayIST(fromDate), getEndOfDayIST(toDate)] };
        } else {
            dateFilter.createdAt = { [Op.between]: [getStartOfDayIST(), getEndOfDayIST()] };
        }

        logToFile(`[STOCK SUMMARY] Request for Tenant: ${req.tenantId}, From: ${fromDate}, To: ${toDate}`);
        const [materials, purchases, recipes, orders, wastages] = await Promise.all([
            RawMaterial.findAll({ where: { tenantId: req.tenantId } }),
            PurchaseItem.findAll({ where: dateFilter, attributes: ['rawMaterialId', 'quantity'] }),
            Recipe.findAll({
                where: { tenantId: req.tenantId },
                include: [{ model: RecipeIngredient }]
            }),
            Order.findAll({
                where: dateFilter,
                include: [{ model: OrderItem, as: 'items' }]
            }),
            WastageItem.findAll({ where: dateFilter, attributes: ['rawMaterialId', 'quantity'] })
        ]);

        logToFile(`[STOCK SUMMARY] Found ${materials.length} materials, ${purchases.length} purchases, ${orders.length} orders, ${wastages.length} wastage records.`);

        // 1. Build Purchase Map
        const purchaseMap = {};
        purchases.forEach(p => { purchaseMap[p.rawMaterialId] = (purchaseMap[p.rawMaterialId] || 0) + p.quantity; });

        // 2. Build Wastage Map
        const wastageMap = {};
        wastages.forEach(w => { wastageMap[w.rawMaterialId] = (wastageMap[w.rawMaterialId] || 0) + w.quantity; });

        // 3. Build Recipe Map (Key: itemId_variantId or itemId_null)
        const recipeMap = {};
        recipes.forEach(r => {
            const key = `${r.itemId}_${r.variantId || 'null'}`;
            recipeMap[key] = r;
        });

        // 4. Calculate Consumption
        const consumedMap = {};
        console.log(`[STOCK SUMMARY] Calculating for ${orders.length} orders...`);
        orders.forEach(order => {
            const items = order.items || order.OrderItems || [];
            items.forEach(orderItem => {
                // Try to find recipe by Variant first, then Item
                let recipe = recipeMap[`${orderItem.itemId}_${orderItem.variantId}`] ||
                    recipeMap[`${orderItem.itemId}_null`];

                if (recipe && recipe.autoConsumption !== false) {
                    const ingredients = recipe.RecipeIngredients || [];
                    const yieldQty = recipe.yieldQty || 1;
                    ingredients.forEach(ing => {
                        const consumption = (ing.quantity / yieldQty) * orderItem.quantity;
                        consumedMap[ing.rawMaterialId] = (consumedMap[ing.rawMaterialId] || 0) + consumption;
                    });
                }
            });
        });

        const today = getTodayIST();
        const report = await Promise.all(materials.map(async (m) => {
            const purchaseQty = purchaseMap[m.id] || 0;
            const consumedQty = consumedMap[m.id] || 0;
            const wastageQty = wastageMap[m.id] || 0;
            const currentStock = m.currentStock;

            let openingStock = m.openingStock || 0;
            if (!m.lastStockUpdateDate || m.lastStockUpdateDate !== today) {
                // Approximate opening if not snapshotted today
                openingStock = currentStock - purchaseQty + consumedQty + wastageQty;
                await m.update({ openingStock, lastStockUpdateDate: today });
            }

            return {
                id: m.id,
                sku: m.barcode || `RM${m.id.toString().padStart(3, '0')}`,
                name: m.name,
                unit: m.consumptionUnit,
                opening: Math.max(0, openingStock),
                purchase: purchaseQty,
                totalInput: Math.max(0, openingStock) + purchaseQty,
                consumed: consumedQty,
                wastage: wastageQty,
                totalOutput: consumedQty + wastageQty,
                closingStock: currentStock,
                closingSummary: currentStock,
                difference: Math.abs(currentStock - (openingStock + purchaseQty - consumedQty - wastageQty)) > 0.01
                    ? (currentStock - (openingStock + purchaseQty - consumedQty - wastageQty))
                    : 0
            };
        }));

        res.json(report);
    } catch (error) {
        console.error("Stock Summary Error:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getOrderWiseConsumptionReport = async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: { tenantId: req.tenantId },
            include: [{ model: OrderItem, as: 'items' }],
            order: [['createdAt', 'DESC']],
            limit: 50
        });
        const recipes = await Recipe.findAll({ where: { tenantId: req.tenantId }, include: [{ model: RecipeIngredient, include: [RawMaterial] }] });
        const recipeMap = {};
        recipes.forEach(r => { recipeMap[`${r.itemId}_${r.variantId || 'null'}`] = r; });

        const reportOrders = orders.map(order => {
            let totalCost = 0;
            const items = (order.items || []).map(orderItem => {
                let recipe = recipeMap[`${orderItem.itemId}_${orderItem.variantId}`] || recipeMap[`${orderItem.itemId}_null`];
                const ingredients = recipe ? (recipe.RecipeIngredients || []).map(ri => {
                    const cost = ri.quantity * (ri.RawMaterial?.purchasePrice || 0) * orderItem.quantity;
                    totalCost += cost;
                    return { name: ri.RawMaterial?.name, qty: `${ri.quantity * orderItem.quantity} ${ri.unit}`, cost };
                }) : [];
                return { name: orderItem.itemName, qty: orderItem.quantity, price: orderItem.price * orderItem.quantity, ingredients };
            });
            return { orderNo: order.orderNumber, date: order.createdAt, totalPrice: order.totalAmount, profitPercent: order.totalAmount > 0 ? (((order.totalAmount - totalCost) / order.totalAmount) * 100).toFixed(2) : 0, cogs: totalCost, items };
        });

        res.json({ orders: reportOrders, summary: { totalSales: reportOrders.reduce((Acc, o) => Acc + o.totalPrice, 0), totalCost: reportOrders.reduce((Acc, o) => Acc + o.cogs, 0) } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getConsumptionSummaryReport = async (req, res) => {
    try {
        const materials = await RawMaterial.findAll({ where: { tenantId: req.tenantId } });
        res.json(materials.map(m => ({ id: m.id, name: m.name, unit: m.consumptionUnit, date: new Date(), consumption: 0, price: m.purchasePrice, cost: 0 })));
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.updateClosingStock = async (req, res) => {
    try {
        const { updates } = req.body;
        for (const update of updates) {
            const material = await RawMaterial.findOne({ where: { id: update.id, tenantId: req.tenantId } });
            if (material) await material.update({ currentStock: update.closingSummary });
        }
        res.json({ message: 'Closing stock updated' });
    } catch (error) { res.status(500).json({ error: error.message }); }
};
exports.getStockHistoryReport = async (req, res) => {
    try {
        const { fromDate, toDate, rawMaterialId } = req.query;
        const where = { tenantId: req.tenantId };

        if (fromDate && toDate) {
            where.createdAt = { [Op.between]: [getStartOfDayIST(fromDate), getEndOfDayIST(toDate)] };
        }

        if (rawMaterialId) {
            where.rawMaterialId = rawMaterialId;
        }

        const transactions = await StockTransaction.findAll({
            where,
            include: [{ model: RawMaterial, attributes: ['name', 'consumptionUnit'] }],
            order: [['createdAt', 'DESC']]
        });

        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
