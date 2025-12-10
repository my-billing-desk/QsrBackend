const { AddonGroup, VariationGroup, Addon, Variant, Item, ItemAddonGroup, ItemVariationGroup } = require('../models');

// --- Addon Groups ---

exports.getAddonGroups = async (req, res) => {
    try {
        const groups = await AddonGroup.findAll({
            include: [Addon],
            order: [[Addon, 'sortOrder', 'ASC'], [Addon, 'id', 'ASC']]
        });
        res.json(groups);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createAddonGroup = async (req, res) => {
    try {
        const { name, description, minSelection, maxSelection, addons } = req.body;
        // addons is expected to be an array of { name, price, type, sortOrder }

        const group = await AddonGroup.create({
            name, description, minSelection, maxSelection
        });

        if (addons && addons.length > 0) {
            const addonPromises = addons.map((addon, index) => Addon.create({
                ...addon,
                sortOrder: addon.sortOrder !== undefined ? addon.sortOrder : index,
                addonGroupId: group.id
            }));
            await Promise.all(addonPromises);
        }

        const completeGroup = await AddonGroup.findByPk(group.id, {
            include: [Addon],
            order: [[Addon, 'sortOrder', 'ASC'], [Addon, 'id', 'ASC']]
        });
        res.status(201).json(completeGroup);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteAddonGroup = async (req, res) => {
    try {
        const { id } = req.params;
        await AddonGroup.destroy({ where: { id } });
        res.json({ message: 'Addon Group deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- Variation Groups ---

exports.getVariationGroups = async (req, res) => {
    try {
        const groups = await VariationGroup.findAll({
            include: [Variant],
            order: [[Variant, 'sortOrder', 'ASC'], [Variant, 'id', 'ASC']]
        });
        res.json(groups);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createVariationGroup = async (req, res) => {
    try {
        const { name, description, onlineDisplayName, departmentName, isActive, variants } = req.body;
        // variants is expected to be an array of { name, price, sapCode, ... }

        const group = await VariationGroup.create({
            name, description, onlineDisplayName, departmentName, isActive
        });

        if (variants && variants.length > 0) {
            const variantPromises = variants.map((variant, index) => Variant.create({
                ...variant,
                sortOrder: variant.sortOrder !== undefined ? variant.sortOrder : index,
                variationGroupId: group.id
            }));
            await Promise.all(variantPromises);
        }

        const completeGroup = await VariationGroup.findByPk(group.id, {
            include: [Variant],
            order: [[Variant, 'sortOrder', 'ASC'], [Variant, 'id', 'ASC']]
        });
        res.status(201).json(completeGroup);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteVariationGroup = async (req, res) => {
    try {
        const { id } = req.params;
        await VariationGroup.destroy({ where: { id } });
        res.json({ message: 'Variation Group deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- Assignment ---

exports.assignGroupsToItem = async (req, res) => {
    try {
        const { itemId, addonGroupIds, variationGroupIds } = req.body;

        const item = await Item.findByPk(itemId);
        if (!item) return res.status(404).json({ error: 'Item not found' });

        if (addonGroupIds) {
            await item.setAddonGroups(addonGroupIds);
        }

        if (variationGroupIds) {
            await item.setVariationGroups(variationGroupIds);
        }

        res.json({ message: 'Groups assigned successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
