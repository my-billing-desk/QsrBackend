const { Table, Tax, Discount } = require('../models');

// Tables
exports.getTables = async (req, res) => {
    try {
        const tables = await Table.findAll();
        res.json(tables);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createTable = async (req, res) => {
    try {
        const table = await Table.create(req.body);
        res.status(201).json(table);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteTable = async (req, res) => {
    try {
        await Table.destroy({ where: { id: req.params.id } });
        res.json({ message: 'Table deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Taxes
exports.getTaxes = async (req, res) => {
    try {
        const taxes = await Tax.findAll();
        res.json(taxes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createTax = async (req, res) => {
    try {
        const tax = await Tax.create(req.body);
        res.status(201).json(tax);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteTax = async (req, res) => {
    try {
        await Tax.destroy({ where: { id: req.params.id } });
        res.json({ message: 'Tax deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Discounts
exports.getDiscounts = async (req, res) => {
    try {
        const discounts = await Discount.findAll();
        res.json(discounts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createDiscount = async (req, res) => {
    try {
        const discount = await Discount.create(req.body);
        res.status(201).json(discount);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteDiscount = async (req, res) => {
    try {
        await Discount.destroy({ where: { id: req.params.id } });
        res.json({ message: 'Discount deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
