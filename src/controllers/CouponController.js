const { Coupon } = require('../models');
const { Op } = require('sequelize');

class CouponController {
    // Get all active coupons for current tenant
    static async getActiveCoupons(req, res) {
        try {
            const { tenantId } = req.user;
            const now = new Date();

            const coupons = await Coupon.findAll({
                where: {
                    tenantId,
                    isActive: true,
                    validFrom: { [Op.lte]: now },
                    validUntil: { [Op.gte]: now },
                    [Op.or]: [
                        { maxUsage: null },
                        { usageCount: { [Op.lt]: sequelize.col('maxUsage') } }
                    ]
                },
                order: [
                    ['source', 'ASC'],
                    ['name', 'ASC']
                ]
            });

            res.json(coupons);
        } catch (error) {
            console.error('Error fetching coupons:', error);
            res.status(500).json({ error: 'Failed to fetch coupons' });
        }
    }

    // Validate and apply coupon
    static async validateCoupon(req, res) {
        try {
            const { code, orderTotal, customerId, storeId, items } = req.body;
            const { tenantId } = req.user;
            const now = new Date();

            // Find coupon
            const coupon = await Coupon.findOne({
                where: {
                    tenantId,
                    code: code.toUpperCase(),
                    isActive: true
                }
            });

            if (!coupon) {
                return res.status(400).json({
                    error: 'REST_COUPON_INVALID',
                    message: 'Invalid coupon code. Please check and try again.'
                });
            }

            // Check validity dates
            if (now < new Date(coupon.validFrom) || now > new Date(coupon.validUntil)) {
                return res.status(400).json({
                    error: 'REST_COUPON_EXPIRED',
                    message: `This coupon is not valid. Valid from ${coupon.validFrom.toLocaleDateString()} to ${coupon.validUntil.toLocaleDateString()}`
                });
            }

            // Check minimum order amount
            if (orderTotal < coupon.minOrderAmount) {
                return res.status(400).json({
                    error: 'REST_COUPON_DISCOUNT_INVALID_MIN_ORDER_AMOUNT',
                    message: `Minimum order amount of ₹${coupon.minOrderAmount} is required for this coupon.`,
                    required: coupon.minOrderAmount,
                    current: orderTotal
                });
            }

            // Check maximum usage limit
            if (coupon.maxUsage && coupon.usageCount >= coupon.maxUsage) {
                return res.status(400).json({
                    error: 'REST_COUPON_MAX_USAGE_REACHED',
                    message: 'This coupon has reached its maximum usage limit.'
                });
            }

            // Check applicable stores
            if (coupon.applicableStores && coupon.applicableStores.length > 0) {
                if (!storeId || !coupon.applicableStores.includes(storeId)) {
                    return res.status(400).json({
                        error: 'REST_COUPON_STORE_NOT_APPLICABLE',
                        message: 'This coupon is not applicable for this store location.',
                        customMessage: coupon.errorMessage || 'Open offers applicable only on selected stores'
                    });
                }
            }

            // Check applicable items (for item-specific coupons)
            if (coupon.applicableItems && coupon.applicableItems.length > 0) {
                const itemIds = items?.map(i => i.itemId) || [];
                const hasApplicableItem = itemIds.some(id =>
                    coupon.applicableItems.includes(id)
                );

                if (!hasApplicableItem) {
                    return res.status(400).json({
                        error: 'REST_COUPON_ITEM_NOT_APPLICABLE',
                        message: 'This coupon is not applicable for items in your cart.'
                    });
                }
            }

            // Calculate discount
            let discountAmount = 0;
            if (coupon.discountType === 'percentage') {
                discountAmount = (orderTotal * coupon.discountValue) / 100;
                if (coupon.maxDiscountAmount) {
                    discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
                }
            } else if (coupon.discountType === 'fixed') {
                discountAmount = Math.min(coupon.discountValue, orderTotal);
            }

            // Round to 2 decimals
            discountAmount = Math.round(discountAmount * 100) / 100;

            res.json({
                valid: true,
                coupon: {
                    id: coupon.id,
                    code: coupon.code,
                    name: coupon.name,
                    source: coupon.source,
                    discountType: coupon.discountType,
                    discountValue: coupon.discountValue
                },
                discountAmount,
                finalAmount: orderTotal - discountAmount
            });
        } catch (error) {
            console.error('Error validating coupon:', error);
            res.status(500).json({ error: 'Failed to validate coupon' });
        }
    }

    // Apply coupon (increment usage count)
    static async applyCoupon(req, res) {
        try {
            const { couponId, customerId } = req.body;
            const { tenantId } = req.user;

            const coupon = await Coupon.findOne({
                where: { id: couponId, tenantId }
            });

            if (!coupon) {
                return res.status(404).json({ error: 'Coupon not found' });
            }

            // Increment usage count
            await coupon.update({
                usageCount: coupon.usageCount + 1
            });

            // TODO: Track per-customer usage in separate CouponUsage table

            res.json({
                success: true,
                message: 'Coupon applied successfully'
            });
        } catch (error) {
            console.error('Error applying coupon:', error);
            res.status(500).json({ error: 'Failed to apply coupon' });
        }
    }

    // Admin: Create coupon
    static async createCoupon(req, res) {
        try {
            const { tenantId } = req.user;
            const couponData = { ...req.body, tenantId };

            const coupon = await Coupon.create(couponData);

            res.status(201).json(coupon);
        } catch (error) {
            console.error('Error creating coupon:', error);
            res.status(500).json({ error: 'Failed to create coupon' });
        }
    }

    // Admin: Update coupon
    static async updateCoupon(req, res) {
        try {
            const { id } = req.params;
            const { tenantId } = req.user;

            const coupon = await Coupon.findOne({
                where: { id, tenantId }
            });

            if (!coupon) {
                return res.status(404).json({ error: 'Coupon not found' });
            }

            await coupon.update(req.body);

            res.json(coupon);
        } catch (error) {
            console.error('Error updating coupon:', error);
            res.status(500).json({ error: 'Failed to update coupon' });
        }
    }

    // Admin: Delete coupon
    static async deleteCoupon(req, res) {
        try {
            const { id } = req.params;
            const { tenantId } = req.user;

            const coupon = await Coupon.findOne({
                where: { id, tenantId }
            });

            if (!coupon) {
                return res.status(404).json({ error: 'Coupon not found' });
            }

            await coupon.destroy();

            res.json({ success: true, message: 'Coupon deleted' });
        } catch (error) {
            console.error('Error deleting coupon:', error);
            res.status(500).json({ error: 'Failed to delete coupon' });
        }
    }
}

module.exports = CouponController;
