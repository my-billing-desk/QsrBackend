const { SplitPayment, PaymentAllocation, Order, OrderItem, sequelize } = require('../models');

/**
 * Bill Splitting Service
 * Handles splitting bills by item, seat, or equally
 */

class BillSplitService {
    /**
     * Create a split payment for an order
     * @param {number} orderId - Order ID
     * @param {string} splitType - 'item', 'seat', or 'equal'
     * @param {Object} config - Split configuration
     * @param {number} userId - User creating the split
     * @param {string} tenantId - Tenant ID
     * @returns {Promise<Object>} - Split payment with allocations
     */
    async createSplit(orderId, splitType, config, userId, tenantId) {
        const transaction = await sequelize.transaction();

        try {
            // Get order with items
            const order = await Order.findByPk(orderId, {
                include: [{ model: OrderItem, as: 'items' }],
                transaction
            });

            if (!order) {
                throw new Error('Order not found');
            }

            // Check if order already has an active split
            const existingSplit = await SplitPayment.findOne({
                where: { orderId, status: 'active' },
                transaction
            });

            if (existingSplit) {
                throw new Error('Order already has an active split');
            }

            let allocations;
            let totalSplits;

            // Execute appropriate split logic
            switch (splitType) {
                case 'item':
                    ({ allocations, totalSplits } = this.splitByItems(order, config));
                    break;
                case 'seat':
                    ({ allocations, totalSplits } = this.splitBySeat(order, config));
                    break;
                case 'equal':
                    ({ allocations, totalSplits } = this.splitEqually(order, config.splitCount));
                    break;
                default:
                    throw new Error(`Invalid split type: ${splitType}`);
            }

            // Create split payment record
            const splitPayment = await SplitPayment.create({
                orderId,
                splitType,
                totalSplits,
                originalTotal: order.totalAmount,
                status: 'active',
                metadata: config,
                createdBy: userId,
                tenantId
            }, { transaction });

            // Create payment allocations
            const allocationRecords = await PaymentAllocation.bulkCreate(
                allocations.map(alloc => ({
                    ...alloc,
                    orderId,
                    splitPaymentId: splitPayment.id,
                    tenantId
                })),
                { transaction }
            );

            await transaction.commit();

            return {
                splitPayment,
                allocations: allocationRecords
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Split by items - assign specific items to each person
     * @param {Object} order - Order object
     * @param {Object} config - { itemAllocations: [{ splitNumber, itemIds }] }
     */
    splitByItems(order, config) {
        const { itemAllocations } = config;
        const totalSplits = itemAllocations.length;
        const allocations = [];

        // Calculate tax rate from order
        const taxRate = order.taxAmount / order.subtotal || 0;

        for (const allocation of itemAllocations) {
            // Get items for this split
            const splitItems = order.items.filter(item =>
                allocation.itemIds.includes(item.id)
            );

            // Calculate subtotal
            const subtotal = splitItems.reduce((sum, item) => sum + parseFloat(item.total), 0);

            // Calculate tax proportionally
            const taxAmount = subtotal * taxRate;

            allocations.push({
                splitNumber: allocation.splitNumber,
                subtotal,
                taxAmount,
                totalAmount: subtotal + taxAmount,
                orderItemIds: allocation.itemIds,
                status: 'pending'
            });
        }

        return { allocations, totalSplits };
    }

    /**
     * Split by seat - group items by seat number
     * @param {Object} order - Order object
     * @param {Object} config - { seatCount }
     */
    splitBySeat(order, config) {
        const { seatCount } = config;
        const allocations = [];

        // Calculate tax rate
        const taxRate = order.taxAmount / order.subtotal || 0;

        // Group items by seat
        const itemsBySeat = {};
        for (let seat = 1; seat <= seatCount; seat++) {
            itemsBySeat[seat] = order.items.filter(item => item.seatNumber === seat);
        }

        for (let seat = 1; seat <= seatCount; seat++) {
            const seatItems = itemsBySeat[seat] || [];

            if (seatItems.length === 0) continue;

            const subtotal = seatItems.reduce((sum, item) => sum + parseFloat(item.total), 0);
            const taxAmount = subtotal * taxRate;

            allocations.push({
                splitNumber: seat,
                seatNumber: seat,
                subtotal,
                taxAmount,
                totalAmount: subtotal + taxAmount,
                orderItemIds: seatItems.map(item => item.id),
                status: 'pending'
            });
        }

        return { allocations, totalSplits: allocations.length };
    }

    /**
     * Split equally - divide total by N people
     * @param {Object} order - Order object
     * @param {number} splitCount - Number of people
     */
    splitEqually(order, splitCount) {
        if (splitCount < 2) {
            throw new Error('Split count must be at least 2');
        }

        const total = parseFloat(order.totalAmount);

        // Use largest remainder method for penny distribution
        const amounts = this.distributePennies(total, splitCount);

        const allocations = amounts.map((amount, index) => ({
            splitNumber: index + 1,
            subtotal: amount * (order.subtotal / total), // Proportional subtotal
            taxAmount: amount * (order.taxAmount / total), // Proportional tax
            totalAmount: amount,
            orderItemIds: [], // Equal split doesn't assign specific items
            status: 'pending'
        }));

        return { allocations, totalSplits: splitCount };
    }

    /**
     * Distribute pennies using largest remainder method
     * Ensures total is exact with no rounding errors
     */
    distributePennies(total, splits) {
        // Calculate base amount (floor to 2 decimals)
        const baseAmount = Math.floor((total / splits) * 100) / 100;

        // Calculate remainder in cents
        const totalCents = Math.round(total * 100);
        const distributedCents = Math.round(baseAmount * splits * 100);
        const remainderCents = totalCents - distributedCents;

        // Create array of base amounts
        const amounts = Array(splits).fill(baseAmount);

        // Distribute extra pennies to first N splits
        for (let i = 0; i < remainderCents; i++) {
            amounts[i] += 0.01;
        }

        // Round to 2 decimals to avoid floating point errors
        return amounts.map(amt => Math.round(amt * 100) / 100);
    }

    /**
     * Record payment for a split
     */
    async recordPayment(allocationId, paymentMethod, amount, tenantId) {
        const allocation = await PaymentAllocation.findOne({
            where: { id: allocationId, tenantId }
        });

        if (!allocation) {
            throw new Error('Payment allocation not found');
        }

        const newPaidAmount = parseFloat(allocation.paidAmount) + parseFloat(amount);
        const isFullyPaid = newPaidAmount >= parseFloat(allocation.totalAmount);

        await allocation.update({
            paymentMethod,
            paidAmount: newPaidAmount,
            status: isFullyPaid ? 'paid' : 'partial',
            paidAt: isFullyPaid ? new Date() : allocation.paidAt
        });

        // Check if all splits are paid
        const splitPayment = await SplitPayment.findByPk(allocation.splitPaymentId);
        const allAllocations = await PaymentAllocation.findAll({
            where: { splitPaymentId: splitPayment.id }
        });

        const allPaid = allAllocations.every(alloc => alloc.status === 'paid');

        if (allPaid) {
            await splitPayment.update({ status: 'completed' });
        }

        return allocation;
    }

    /**
     * Get split payment details
     */
    async getSplitDetails(orderId, tenantId) {
        const splitPayment = await SplitPayment.findOne({
            where: { orderId, tenantId, status: 'active' },
            include: [
                {
                    model: PaymentAllocation,
                    as: 'allocations'
                }
            ]
        });

        return splitPayment;
    }

    /**
     * Cancel a split payment
     */
    async cancelSplit(splitPaymentId, tenantId) {
        const splitPayment = await SplitPayment.findOne({
            where: { id: splitPaymentId, tenantId }
        });

        if (!splitPayment) {
            throw new Error('Split payment not found');
        }

        // Check if any payments have been made
        const allocations = await PaymentAllocation.findAll({
            where: { splitPaymentId, status: 'paid' }
        });

        if (allocations.length > 0) {
            throw new Error('Cannot cancel split - payments have been made');
        }

        await splitPayment.update({ status: 'cancelled' });
        await PaymentAllocation.update(
            { status: 'cancelled' },
            { where: { splitPaymentId } }
        );

        return splitPayment;
    }
}

module.exports = new BillSplitService();
