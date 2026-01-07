const { Category, Item, Variant, Addon, AddonGroup, VariationGroup, sequelize } = require('../models');

// Categories
// Categories
exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({
            where: { tenantId: req.tenantId },
            order: [['sortOrder', 'ASC'], ['id', 'ASC']]
        });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const category = await Category.create({ ...req.body, tenantId: req.tenantId });
        res.status(201).json(category);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        await Category.destroy({ where: { id: req.params.id, tenantId: req.tenantId } });
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
                where: { id: update.id, tenantId: req.tenantId }, // Scoped to tenant
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
            where: { tenantId: req.tenantId },
            include: [
                Category,
                {
                    model: VariationGroup,
                    as: 'variationGroups',
                    include: [Variant]
                },
                {
                    model: Variant,
                    include: [VariationGroup]
                },
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
                [{ model: VariationGroup, as: 'variationGroups' }, { model: Variant }, 'sortOrder', 'ASC'],
                [{ model: VariationGroup, as: 'variationGroups' }, { model: Variant }, 'id', 'ASC'],
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
        // When using FormData, complex fields like variants need parsing if sent as JSON strings
        let { variants, addonGroupIds, variationGroupIds, ondcTags, ...itemData } = req.body;

        if (typeof variants === 'string') variants = JSON.parse(variants);
        if (typeof addonGroupIds === 'string') addonGroupIds = JSON.parse(addonGroupIds);
        if (typeof variationGroupIds === 'string') variationGroupIds = JSON.parse(variationGroupIds);
        if (typeof ondcTags === 'string') ondcTags = JSON.parse(ondcTags);

        if (req.file) {
            itemData.image = `/uploads/${req.file.filename}`;
        } else if (itemData.image && typeof itemData.image !== 'string') {
            // Prevent objects/arrays from hitting the DB
            delete itemData.image;
        }

        // Clean up boolean fields coming as strings in FormData
        if (itemData.showImage === 'true') itemData.showImage = true;
        if (itemData.showImage === 'false') itemData.showImage = false;
        if (itemData.availableOndc === 'true') itemData.availableOndc = true;
        if (itemData.availableOndc === 'false') itemData.availableOndc = false;

        // Force Tenant ID
        itemData.tenantId = req.tenantId;

        // Create Item
        const item = await Item.create(itemData, { transaction: t });

        // Create Variants if provided
        if (variants && Array.isArray(variants) && variants.length > 0) {
            const variantPromises = variants.map(v => Variant.create({
                ...v,
                itemId: item.id,
                tenantId: req.tenantId
            }, { transaction: t }));
            await Promise.all(variantPromises);
        }

        // Assign Addon Groups if provided
        if (addonGroupIds && Array.isArray(addonGroupIds)) {
            await item.setAddonGroups(addonGroupIds, { transaction: t });
        }

        // Handle Variation Groups
        if (variationGroupIds && Array.isArray(variationGroupIds)) {
            await item.setVariationGroups(variationGroupIds, { transaction: t });
        }

        await t.commit();

        // Fetch complete item
        const completeItem = await Item.findOne({
            where: { id: item.id, tenantId: req.tenantId },
            include: [
                Variant,
                { model: AddonGroup, as: 'addonGroups' },
                { model: VariationGroup, as: 'variationGroups' }
            ]
        });
        res.status(201).json(completeItem);
    } catch (error) {
        if (!t.finished) await t.rollback();
        res.status(400).json({ error: error.message });
    }
};

exports.updateItem = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        let { variants, addonGroupIds, variationGroupIds, ondcTags, ...itemData } = req.body;

        if (typeof variants === 'string') variants = JSON.parse(variants);
        if (typeof addonGroupIds === 'string') addonGroupIds = JSON.parse(addonGroupIds);
        if (typeof variationGroupIds === 'string') variationGroupIds = JSON.parse(variationGroupIds);
        if (typeof ondcTags === 'string') ondcTags = JSON.parse(ondcTags);

        if (req.file) {
            itemData.image = `/uploads/${req.file.filename}`;
        } else if (itemData.image && typeof itemData.image !== 'string') {
            delete itemData.image;
        }

        // Clean up boolean fields coming as strings in FormData
        if (itemData.showImage === 'true') itemData.showImage = true;
        if (itemData.showImage === 'false') itemData.showImage = false;
        if (itemData.availableOndc === 'true') itemData.availableOndc = true;
        if (itemData.availableOndc === 'false') itemData.availableOndc = false;

        const item = await Item.findOne({ where: { id, tenantId: req.tenantId } });
        if (!item) {
            await t.rollback();
            return res.status(404).json({ error: 'Item not found' });
        }

        // Update Item details
        await item.update(itemData, { transaction: t });

        // Handle Variants: Replace strategy
        if (variants) {
            await Variant.destroy({ where: { itemId: id, tenantId: req.tenantId }, transaction: t });
            if (Array.isArray(variants) && variants.length > 0) {
                const variantPromises = variants.map(v => Variant.create({
                    ...v,
                    itemId: id,
                    tenantId: req.tenantId
                }, { transaction: t }));
                await Promise.all(variantPromises);
            }
        }

        // Handle AddonGroups (ManyToMany - usually safe but good to check ownership of groups if strict)
        if (addonGroupIds) {
            await item.setAddonGroups(addonGroupIds, { transaction: t });
        }

        // Handle VariationGroups
        if (variationGroupIds) {
            await item.setVariationGroups(variationGroupIds, { transaction: t });
        }

        await t.commit();

        const updatedItem = await Item.findOne({
            where: { id, tenantId: req.tenantId },
            include: [
                Variant,
                { model: AddonGroup, as: 'addonGroups' },
                { model: VariationGroup, as: 'variationGroups' }
            ]
        });
        res.json(updatedItem);
    } catch (error) {
        if (!t.finished) await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

exports.deleteItem = async (req, res) => {
    try {
        await Item.destroy({ where: { id: req.params.id, tenantId: req.tenantId } });
        res.json({ message: 'Item deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateItemStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body; // e.g. { availableOffline: false }
        const item = await Item.findOne({ where: { id, tenantId: req.tenantId } });
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
                    isSelfItemRecipe: mainRow['is_Self_Item_Recipe'] == 'TRUE',
                    minimumStockLevel: parseFloat(mainRow['minimum_stock_level']) || 0,
                    atParStockLevel: parseFloat(mainRow['at_par_stock_level']) || 0,
                    rank: parseInt(mainRow['Rank']) || 0,
                    packingCharges: parseFloat(mainRow['Packing_Charges']) || 0,
                    allowDecimalQty: mainRow['Allow_Decimal_Qty'] == 'TRUE',
                    availableOffline: mainRow['Available_Offline'] == 'TRUE',
                    availableSwiggy: mainRow['Available_Swiggy'] == 'TRUE',
                    availableZomato: mainRow['Available_Zomato'] == 'TRUE',
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
                    availableOffline: mainRow['Available_Offline'] == 'TRUE',
                    availableSwiggy: mainRow['Available_Swiggy'] == 'TRUE',
                    availableZomato: mainRow['Available_Zomato'] == 'TRUE'
                }, { transaction: t });
                results.updated++;
            } else {
                results.created++;
            }

            // 3. Handle Variations (Iterate all rows in group)
            // 3. Handle Variations (Iterate all rows in group)
            const seenVariants = new Set();
            const itemVariationGroups = new Set(); // Track unique variation groups for this item

            for (const row of groupRows) {
                const varName = row['Variation'];
                if (varName && !seenVariants.has(varName)) {
                    seenVariants.add(varName);

                    // Handle VariationGroup
                    let vgId = null;
                    if (row['Variation_group_name']) {
                        // Find or Create VG
                        const [vg, vgCreated] = await VariationGroup.findOrCreate({
                            where: { name: row['Variation_group_name'] },
                            defaults: {
                                departmentName: row['Variation_Group_Department'] || null
                            },
                            transaction: t
                        });

                        // If it existed but department is new/updated in CSV, update it? 
                        // Let's assume CSV dictates truth if provided
                        if (!vgCreated && row['Variation_Group_Department']) {
                            await vg.update({ departmentName: row['Variation_Group_Department'] }, { transaction: t });
                        }

                        vgId = vg.id;
                        itemVariationGroups.add(vg.id);

                        // Master Variant (Template) - ensure it exists in the Group globally
                        await Variant.findOrCreate({
                            where: {
                                name: varName,
                                variationGroupId: vgId,
                                itemId: null
                            },
                            defaults: {
                                price: parseFloat(row['Variation_Price']) || 0,
                                sapCode: row['Variation_Sap_Code'],
                                packingCharges: parseFloat(row['Variation_Packing_Charges']) || 0
                            },
                            transaction: t
                        });
                    }

                    await Variant.findOrCreate({
                        where: {
                            name: varName,
                            itemId: item.id
                        },
                        defaults: {
                            price: parseFloat(row['Variation_Price']) || 0,
                            variationGroupId: vgId,
                            sapCode: row['Variation_Sap_Code'],
                            packingCharges: parseFloat(row['Variation_Packing_Charges']) || 0
                        },
                        transaction: t
                    });
                }
            }

            // Link Item to Variation Groups
            if (itemVariationGroups.size > 0) {
                await item.setVariationGroups(Array.from(itemVariationGroups), { transaction: t });
            }

            // 4. Handle Addon Groups
            const seenAddons = new Set();
            const itemAddonGroups = new Set();

            for (const row of groupRows) {
                const agName = row['Addon_Group_Name'];
                // If Addon Group Name exists
                if (agName) {
                    // Find or Create Addon Group
                    // Note: AddonGroups are global entities usually, so finding by Name is key.
                    const [ag] = await AddonGroup.findOrCreate({
                        where: { name: agName },
                        defaults: {
                            minSelection: parseInt(row['Addon_Group_Min']) || 0,
                            maxSelection: parseInt(row['Addon_Group_Max']) || 1
                        },
                        transaction: t
                    });

                    itemAddonGroups.add(ag.id);

                    // Find or Create Addon
                    const addonName = row['Addon_Name'];
                    if (addonName) {
                        const addonKey = `${ag.id}-${addonName}`;
                        if (!seenAddons.has(addonKey)) {
                            seenAddons.add(addonKey);
                            await Addon.findOrCreate({
                                where: {
                                    name: addonName,
                                    addonGroupId: ag.id
                                },
                                defaults: {
                                    price: parseFloat(row['Addon_Price']) || 0,
                                    packingCharges: parseFloat(row['Addon_Packing_Charges']) || 0,
                                    sortOrder: parseInt(row['Addon_Item_Rank']) || 0
                                },
                                transaction: t
                            });
                        }
                    }
                }
            }

            if (itemAddonGroups.size > 0) {
                await item.setAddonGroups(Array.from(itemAddonGroups), { transaction: t });
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
                { model: Category, include: [{ model: Category, as: 'parentCategory' }] },
                { model: Variant, include: [VariationGroup] },
                {
                    model: AddonGroup,
                    as: 'addonGroups',
                    include: [Addon]
                }
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
                if (item.Category.parentCategory) {
                    parentCategoryName = item.Category.parentCategory.name;
                } else if (item.Category.parentId) {
                    // Fallback check if parentCategory wasn't loaded but ID exists (though include should catch it)
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
                "Available_Zomato": item.availableZomato ? 'TRUE' : 'FALSE'
            };

            const variants = (item.Variants && item.Variants.length > 0) ? item.Variants : [null];

            // Collect all (AddonGroup, AddonOption) pairs
            let addonOptions = [];
            if (item.addonGroups && item.addonGroups.length > 0) {
                item.addonGroups.forEach(ag => {
                    // If group has no addons, still list the group?
                    if (ag.Addons && ag.Addons.length > 0) {
                        ag.Addons.forEach(addon => {
                            addonOptions.push({ group: ag, addon: addon });
                        });
                    } else {
                        addonOptions.push({ group: ag, addon: null });
                    }
                });
            } else {
                addonOptions = [null];
            }

            // Cartesian Product of Variants x AddonOptions
            for (const variant of variants) {
                for (const addonOpt of addonOptions) {
                    const row = { ...baseData };

                    // Variant Data
                    if (variant) {
                        row["Variation_group_name"] = variant.VariationGroup ? variant.VariationGroup.name : '';
                        row["Variation_Group_Department"] = variant.VariationGroup ? (variant.VariationGroup.departmentName || '') : '';
                        row["Variation"] = variant.name;
                        row["Variation_Price"] = variant.price;
                        row["Variation_Sap_Code"] = variant.sapCode || '';
                        row["Variation_Packing_Charges"] = variant.packingCharges || 0;
                    } else {
                        row["Variation_group_name"] = "";
                        row["Variation_Group_Department"] = "";
                        row["Variation"] = "";
                        row["Variation_Price"] = "";
                        row["Variation_Sap_Code"] = "";
                        row["Variation_Packing_Charges"] = "";
                    }

                    // Addon Data
                    if (addonOpt && addonOpt.group) {
                        row["Addon_Group_Name"] = addonOpt.group.name;
                        row["Addon_Group_Selection"] = addonOpt.group.maxSelection > 1 ? 'Multiple' : 'Single';
                        row["Addon_Group_Min"] = addonOpt.group.minSelection;
                        row["Addon_Group_Max"] = addonOpt.group.maxSelection;

                        if (addonOpt.addon) {
                            row["Addon_Name"] = addonOpt.addon.name;
                            row["Addon_Price"] = addonOpt.addon.price;
                            row["Addon_Sap_Code"] = addonOpt.addon.sapCode || '';
                            row["Addon_Packing_Charges"] = addonOpt.addon.packingCharges || 0;
                            row["Addon_Item_Rank"] = addonOpt.addon.sortOrder || 0;
                        } else {
                            row["Addon_Name"] = "";
                            row["Addon_Price"] = "";
                            row["Addon_Sap_Code"] = "";
                            row["Addon_Packing_Charges"] = "";
                            row["Addon_Item_Rank"] = "";
                        }
                    } else {
                        row["Addon_Group_Name"] = "";
                        row["Addon_Group_Selection"] = "";
                        row["Addon_Group_Min"] = "";
                        row["Addon_Group_Max"] = "";
                        row["Addon_Name"] = "";
                        row["Addon_Price"] = "";
                        row["Addon_Sap_Code"] = "";
                        row["Addon_Packing_Charges"] = "";
                        row["Addon_Item_Rank"] = "";
                    }

                    rows.push(row);
                }
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
        const variants = await Variant.findAll({
            where: { tenantId: req.tenantId },
            include: Item
        });
        res.json(variants);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createVariant = async (req, res) => {
    try {
        const variant = await Variant.create({ ...req.body, tenantId: req.tenantId });
        res.status(201).json(variant);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteVariant = async (req, res) => {
    try {
        await Variant.destroy({ where: { id: req.params.id, tenantId: req.tenantId } });
        res.json({ message: 'Variant deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Addons
exports.getAddons = async (req, res) => {
    try {
        const addons = await Addon.findAll({ where: { tenantId: req.tenantId } });
        res.json(addons);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createAddon = async (req, res) => {
    try {
        const addon = await Addon.create({ ...req.body, tenantId: req.tenantId });
        res.status(201).json(addon);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteAddon = async (req, res) => {
    try {
        await Addon.destroy({ where: { id: req.params.id, tenantId: req.tenantId } });
        res.json({ message: 'Addon deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
