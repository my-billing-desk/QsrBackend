const { Order } = require('./src/models');
const { Op } = require('sequelize');

async function debug() {
    try {
        console.log("Debug Script Started");
        console.log("Current Server Date:", new Date().toString());
        console.log("Current Server ISO:", new Date().toISOString());

        // 1. Fetch last 5 orders
        const orders = await Order.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']]
        });

        console.log("\n--- Last 5 Orders ---");
        orders.forEach(o => {
            console.log(`ID: ${o.id}`);
            console.log(`  CreatedAt (DB): ${o.createdAt} (Type: ${typeof o.createdAt})`);
            console.log(`  Parsed Date: ${new Date(o.createdAt).toString()}`);
            console.log(`  Total: ${o.totalAmount}, Status: ${o.status}, Type: ${o.type}`);
        });

        // 2. Logic simulation
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        console.log("\n--- Filter Logic Simulation (Today) ---");
        console.log(`Start: ${todayStart.toISOString()}`);
        console.log(`End:   ${todayEnd.toISOString()}`);

        const matching = orders.filter(o => {
            const d = new Date(o.createdAt);
            const match = d >= todayStart && d <= todayEnd;
            console.log(`  Order ${o.id} (${d.toISOString()}) >= start && <= end? ${match}`);
            return match;
        });

        console.log(`Matches found: ${matching.length}`);

    } catch (e) {
        console.error("Error:", e);
    }
}

debug();
