const {
    sequelize,
    Order, OrderItem,
    Purchase, PurchaseItem,
    PurchaseOrder, PurchaseOrderItem,
    PurchaseReturn, PurchaseReturnItem,
    RawMaterial
} = require('../src/models');

async function clearTransactions() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Database connected.');

        console.log('Clearing Transactional Data...');

        // 1. Clear Orders
        console.log('Deleting OrderItems...');
        await OrderItem.destroy({ where: {}, truncate: { cascade: true } });
        console.log('Deleting Orders...');
        await Order.destroy({ where: {}, truncate: { cascade: true } });

        // 2. Clear Purchases
        console.log('Deleting PurchaseItems...');
        await PurchaseItem.destroy({ where: {}, truncate: { cascade: true } });
        console.log('Deleting Purchases...');
        await Purchase.destroy({ where: {}, truncate: { cascade: true } });

        // 3. Clear Purchase Orders
        console.log('Deleting PurchaseOrderItems...');
        await PurchaseOrderItem.destroy({ where: {}, truncate: { cascade: true } });
        console.log('Deleting PurchaseOrders...');
        await PurchaseOrder.destroy({ where: {}, truncate: { cascade: true } });

        // 4. Clear Returns
        console.log('Deleting PurchaseReturnItems...');
        await PurchaseReturnItem.destroy({ where: {}, truncate: { cascade: true } });
        console.log('Deleting PurchaseReturns...');
        await PurchaseReturn.destroy({ where: {}, truncate: { cascade: true } });

        // 5. Reset Raw Material Stock
        console.log('Resetting Raw Material Stock to 0...');
        await RawMaterial.update({ currentStock: 0 }, { where: {} });

        console.log('✅ All transaction data cleared successfully.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Failed to clear data:', error);
        process.exit(1);
    }
}

clearTransactions();
