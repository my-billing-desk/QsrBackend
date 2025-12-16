const { Aggregator } = require('../models');

exports.getAll = async (req, res) => {
    try {
        const aggregators = await Aggregator.findAll();
        res.json(aggregators);
    } catch (error) {
        res.status(500).json({ message: "Error fetching aggregators", error });
    }
};

exports.toggleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const aggregator = await Aggregator.findByPk(id);
        if (!aggregator) return res.status(404).json({ message: "Aggregator not found" });

        aggregator.isConnected = !aggregator.isConnected;
        await aggregator.save();

        res.json({ message: "Status updated", aggregator });
    } catch (error) {
        res.status(500).json({ message: "Error updating status", error });
    }
};
