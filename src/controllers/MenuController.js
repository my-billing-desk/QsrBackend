const { Category, Item, Variant, Addon, AddonGroup, sequelize } = require('../models');

// Categories
// Categories
exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({
            order: [['sortOrder', 'ASC'], ['id', 'ASC']]
        });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const category = await Category.create(req.body);
        res.status(201).json(category);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        await Category.destroy({ where: { id: req.params.id } });
        res.json({ message: 'Category deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ... (skipping Items section to keep context small, focus on reorderMenuItems update below) ...

exports.reorderMenuItems = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { type, updates } = req.body; // type: 'item' | 'variant' | 'addon' | 'category', updates: [{id: 1, sortOrder: 0}, ...]

        let Model;
        switch (type) {
            case 'item': Model = Item; break;
            case 'variant': Model = Variant; break;
            case 'addon': Model = Addon; break;
            case 'category': Model = Category; break;
            default: throw new Error('Invalid type for reordering');
        }

        for (const update of updates) {
            await Model.update({ sortOrder: update.sortOrder }, {
                where: { id: update.id },
                transaction: t
            });
        }

        await t.commit();
        res.json({ message: 'Order updated successfully' });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

// Items
exports.getItems = async (req, res) => {
    try {
        const items = await Item.findAll({
            include: [
                Category,
                Variant,
                {
                    model: AddonGroup,
                    as: 'addonGroups',
                    include: [Addon]
                }
            ],
            order: [
                ['sortOrder', 'ASC'],
                ['rank', 'ASC'],
                ['id', 'ASC'],
                [Variant, 'sortOrder', 'ASC'],
                [Variant, 'id', 'ASC'],
                [{ model: AddonGroup, as: 'addonGroups' }, { model: Addon }, 'sortOrder', 'ASC'],
                [{ model: AddonGroup, as: 'addonGroups' }, { model: Addon }, 'id', 'ASC']
            ]
        });
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createItem = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { variants, addonGroupIds, ...itemData } = req.body;

        // Create Item
        const item = await Item.create(itemData, { transaction: t });

        // Create Variants if provided
        if (variants && Array.isArray(variants) && variants.length > 0) {
            const variantPromises = variants.map(v => Variant.create({
                ...v,
                itemId: item.id
            }, { transaction: t }));
            await Promise.all(variantPromises);
        }

        // Assign Addon Groups if provided
        if (addonGroupIds && Array.isArray(addonGroupIds) && addonGroupIds.length > 0) {
            await item.setAddonGroups(addonGroupIds, { transaction: t });
        }

        await t.commit();

        // Fetch complete item
        const completeItem = await Item.findByPk(item.id, {
            include: [Variant, { model: AddonGroup, as: 'addonGroups' }]
        });

        res.status(201).json(completeItem);
    } catch (error) {
        await t.rollback();
        res.status(400).json({ error: error.message });
    }
};

exports.updateItem = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { variants, addonGroupIds, ...itemData } = req.body;

        const item = await Item.findByPk(id);
        if (!item) {
            await t.rollback();
            return res.status(404).json({ error: 'Item not found' });
        }

        // Update Item details
        await item.update(itemData, { transaction: t });

        // Handle Variants: Replace strategy
        if (variants) {
            await Variant.destroy({ where: { itemId: id }, transaction: t });
            if (Array.isArray(variants) && variants.length > 0) {
                const variantPromises = variants.map(v => Variant.create({
                    ...v,
                    itemId: id
                }, { transaction: t }));
                await Promise.all(variantPromises);
            }
        }

        // Handle AddonGroups
        if (addonGroupIds) {
            await item.setAddonGroups(addonGroupIds, { transaction: t });
        }

        await t.commit();

        const updatedItem = await Item.findByPk(id, {
            include: [Variant, { model: AddonGroup, as: 'addonGroups' }]
        });
        res.json(updatedItem);
    } catch (error) {
        await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

exports.deleteItem = async (req, res) => {
    try {
        await Item.destroy({ where: { id: req.params.id } });
        res.json({ message: 'Item deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateItemStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body; // e.g. { availableOffline: false }
        const item = await Item.findByPk(id);
        if (!item) return res.status(404).json({ error: 'Item not found' });

        await item.update(updates);
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateBulkStatus = async (req, res) => {
    try {
        const updates = req.body; // Array of objects e.g. [{ name: 'Burger', availableOffline: true }]
        if (!Array.isArray(updates)) {
            return res.status(400).json({ error: 'Body must be an array of updates' });
        }

        const results = [];
        for (const update of updates) {
            let item;
            // Try matching by ID first, then Name
            if (update.id) {
                item = await Item.findByPk(update.id);
            } else if (update.name) {
                item = await Item.findOne({ where: { name: update.name } });
            }

            if (item) {
                // Only update fields that are present in the update object
                const validFields = ['availableOffline', 'availableSwiggy', 'availableZomato', 'isAvailable'];
                const cleanUpdate = {};
                validFields.forEach(field => {
                    if (update[field] !== undefined) {
                        cleanUpdate[field] = update[field];
                    }
                });

                await item.update(cleanUpdate);
                results.push({ id: item.id, name: item.name, status: 'updated' });
            } else {
                results.push({ ...update, status: 'not_found' });
            }
        }
        res.json({ message: 'Bulk update processed', results });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.reorderMenuItems = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { type, updates } = req.body; // type: 'item' | 'variant' | 'addon', updates: [{id: 1, sortOrder: 0}, ...]

        let Model;
        switch (type) {
            case 'item': Model = Item; break;
            case 'variant': Model = Variant; break;
            case 'addon': Model = Addon; break;
            case 'category': Model = Category; break;
            default: throw new Error('Invalid type for reordering');
        }

        for (const update of updates) {
            await Model.update({ sortOrder: update.sortOrder }, {
                where: { id: update.id },
                transaction: t
            });
        }

        await t.commit();
        res.json({ message: 'Order updated successfully' });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

exports.importFullMenu = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const rows = req.body; // Array of objects
        if (!Array.isArray(rows)) return res.status(400).json({ error: 'Body must be an array' });

        // Group rows by Item Name to handle variations
        const itemGroups = {};
        rows.forEach(row => {
            const name = row['Name'];
            if (!name) return;
            if (!itemGroups[name]) itemGroups[name] = [];
            itemGroups[name].push(row);
        });

        const results = { created: 0, updated: 0, errors: 0 };

        for (const [itemName, groupRows] of Object.entries(itemGroups)) {
            // Use the first row for generic item data
            const mainRow = groupRows[0];

            // 1. Handle Category
            let categoryId = null;
            if (mainRow['Category']) {
                let cat = await Category.findOne({ where: { name: mainRow['Category'] }, transaction: t });
                if (!cat) {
                    cat = await Category.create({
                        name: mainRow['Category'],
                        onlineDisplay: mainRow['Category_online_display']
                    }, { transaction: t });
                }
                categoryId = cat.id;

                // Handle Parent Category
                if (mainRow['Parent_Category']) {
                    let parent = await Category.findOne({ where: { name: mainRow['Parent_Category'] }, transaction: t });
                    if (!parent) {
                        parent = await Category.create({ name: mainRow['Parent_Category'] }, { transaction: t });
                    }
                    // Update category parent if not set
                    if (!cat.parentId) {
                        await cat.update({ parentId: parent.id }, { transaction: t });
                    }
                }
            }

            // 2. Upsert Item
            const [item, created] = await Item.findOrCreate({
                where: { name: itemName },
                defaults: {
                    shortCode: mainRow['Short_Code'] || '',
                    price: parseFloat(mainRow['Price']) || 0,
                    categoryId: categoryId,
                    description: mainRow['Description'],
                    onlineName: mainRow['Online_Name'],
                    shortCode2: mainRow['Short_Code_2'],
                    sapCode: mainRow['Sap_Code'],
                    hsnCode: mainRow['HSN_Code'],
                    attributes: mainRow['Attributes'],
                    goodsServices: mainRow['Goods_Services'],
                    unit: mainRow['Unit'],
                    isSelfItemRecipe: mainRow['is_Self_Item_Recipe'] === 'TRUE' || mainRow['is_Self_Item_Recipe'] === '1' || mainRow['is_Self_Item_Recipe'] === true,
                    minimumStockLevel: parseFloat(mainRow['minimum_stock_level']) || 0,
                    atParStockLevel: parseFloat(mainRow['at_par_stock_level']) || 0,
                    rank: parseInt(mainRow['Rank']) || 0,
                    packingCharges: parseFloat(mainRow['Packing_Charges']) || 0,
                    allowDecimalQty: mainRow['Allow_Decimal_Qty'] === 'TRUE' || mainRow['Allow_Decimal_Qty'] === '1',
                    availableOffline: mainRow['Available_Offline'] === 'TRUE' || mainRow['Available_Offline'] === '1',
                    availableSwiggy: mainRow['Available_Swiggy'] === 'TRUE' || mainRow['Available_Swiggy'] === '1',
                    availableZomato: mainRow['Available_Zomato'] === 'TRUE' || mainRow['Available_Zomato'] === '1',
                    isAvailable: true // Default to true on import
                },
                transaction: t
            });

            if (!created) {
                // Update existing item
                await item.update({
                    shortCode: mainRow['Short_Code'],
                    price: parseFloat(mainRow['Price']) || 0,
                    categoryId: categoryId || item.categoryId,
                    description: mainRow['Description'],
                    onlineName: mainRow['Online_Name'],
                    shortCode2: mainRow['Short_Code_2'],
                    sapCode: mainRow['Sap_Code'],
                    hsnCode: mainRow['HSN_Code'],
                    attributes: mainRow['Attributes'],
                    goodsServices: mainRow['Goods_Services'],
                    unit: mainRow['Unit'],
                    isSelfItemRecipe: mainRow['is_Self_Item_Recipe'] == 'TRUE',
                    minimumStockLevel: parseFloat(mainRow['minimum_stock_level']) || 0,
                    atParStockLevel: parseFloat(mainRow['at_par_stock_level']) || 0,
                    rank: parseInt(mainRow['Rank']) || 0,
                    packingCharges: parseFloat(mainRow['Packing_Charges']) || 0,
                    allowDecimalQty: mainRow['Allow_Decimal_Qty'] == 'TRUE',
                    availableOffline: mainRow['Available_Offline'] === 'TRUE' || mainRow['Available_Offline'] === '1',
                    availableSwiggy: mainRow['Available_Swiggy'] === 'TRUE' || mainRow['Available_Swiggy'] === '1',
                    availableZomato: mainRow['Available_Zomato'] === 'TRUE' || mainRow['Available_Zomato'] === '1'
                }, { transaction: t });
                results.updated++;
            } else {
                results.created++;
            }

            // 3. Handle Variations (Iterate all rows in group)
            for (const row of groupRows) {
                const varName = row['Variation'];
                if (varName) {
                    await Variant.findOrCreate({
                        where: {
                            name: varName,
                            itemId: item.id
                        },
                        defaults: {
                            price: parseFloat(row['Variation_Price']) || 0,
                            groupName: row['Variation_group_name'],
                            sapCode: row['Variation_Sap_Code'],
                            packingCharges: parseFloat(row['Variation_Packing_Charges']) || 0
                        },
                        transaction: t
                    });
                }
            }
        }

        await t.commit();
        res.json({ message: 'Full menu import completed', stats: results });
    } catch (error) {
        await t.rollback();
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

exports.exportFullMenu = async (req, res) => {
    try {
        const items = await Item.findAll({
            include: [
                { model: Category, include: [{ model: Category, as: 'parentCategory' }] }, // Self-referencing if defined, or assume structure
                { model: Variant }
            ]
        });

        // Flatten data structure
        const rows = [];
        for (const item of items) {
            let categoryName = '';
            let categoryOnlineDisplay = '';
            let parentCategoryName = '';

            if (item.Category) {
                categoryName = item.Category.name;
                categoryOnlineDisplay = item.Category.onlineDisplay || '';
                // Since there is no actual recursive include in model definition usually, lets query parent if needed or rely on provided structure if user defined it
                // For now, if we don't have deeply nested Category model setup, we might miss Parent Name if not eagerly loaded.
                // But generally users set this up. Let's assume Category has parentId
                if (item.Category.parentId) {
                    const parent = await Category.findByPk(item.Category.parentId);
                    if (parent) parentCategoryName = parent.name;
                }
            }

            // Common item data
            const baseData = {
                "Name": item.name,
                "Online_Name": item.onlineName || '',
                "Description": item.description || '',
                "Short_Code": item.shortCode || '',
                "Short_Code_2": item.shortCode2 || '',
                "Sap_Code": item.sapCode || '',
                "HSN_Code": item.hsnCode || '',
                "Parent_Category": parentCategoryName,
                "Category": categoryName,
                "Category_online_display": categoryOnlineDisplay,
                "Price": item.price,
                "Attributes": item.attributes || '',
                "Goods_Services": item.goodsServices || 'Goods',
                "Unit": item.unit || 'Pcs',
                "is_Self_Item_Recipe": item.isSelfItemRecipe ? 'TRUE' : 'FALSE',
                "minimum_stock_level": item.minimumStockLevel || 0,
                "at_par_stock_level": item.atParStockLevel || 0,
                "Rank": item.rank || 0,
                "Packing_Charges": item.packingCharges || 0,
                "Allow_Decimal_Qty": item.allowDecimalQty ? 'TRUE' : 'FALSE',
                "Available_Offline": item.availableOffline ? 'TRUE' : 'FALSE',
                "Available_Swiggy": item.availableSwiggy ? 'TRUE' : 'FALSE',
                "Available_Zomato": item.availableZomato ? 'TRUE' : 'FALSE',
                "Addon_Group_Name": "",
                "Addon_Group_Selection": "",
                "Addon_Group_Min": "",
                "Addon_Group_Max": ""
            };

            // If variants exist, create a row for each variant
            if (item.Variants && item.Variants.length > 0) {
                item.Variants.forEach(variant => {
                    rows.push({
                        ...baseData,
                        "Variation_group_name": variant.groupName || '',
                        "Variation": variant.name,
                        "Variation_Price": variant.price,
                        "Variation_Sap_Code": variant.sapCode || '',
                        "Variation_Packing_Charges": variant.packingCharges || 0
                    });
                });
            } else {
                // Single item row (no variants)
                rows.push({
                    ...baseData,
                    "Variation_group_name": "",
                    "Variation": "",
                    "Variation_Price": "",
                    "Variation_Sap_Code": "",
                    "Variation_Packing_Charges": ""
                });
            }
        }

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// Variants
exports.getVariants = async (req, res) => {
    try {
        const variants = await Variant.findAll({ include: Item });
        res.json(variants);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createVariant = async (req, res) => {
    try {
        const variant = await Variant.create(req.body);
        res.status(201).json(variant);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteVariant = async (req, res) => {
    try {
        await Variant.destroy({ where: { id: req.params.id } });
        res.json({ message: 'Variant deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Addons
exports.getAddons = async (req, res) => {
    try {
        const addons = await Addon.findAll();
        res.json(addons);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createAddon = async (req, res) => {
    try {
        const addon = await Addon.create(req.body);
        res.status(201).json(addon);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteAddon = async (req, res) => {
    try {
        await Addon.destroy({ where: { id: req.params.id } });
        res.json({ message: 'Addon deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
