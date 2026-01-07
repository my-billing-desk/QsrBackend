const { ONDC } = require('ondc-node');
const { Aggregator } = require('../models');

/**
 * Creates an ONDC instance for a specific tenant based on their Aggregator settings.
 */
const getOndcInstance = async (tenantId) => {
    const agg = await Aggregator.findOne({
        where: { slug: 'ondc', tenantId }
    });

    if (!agg) {
        throw new Error("ONDC integration not found for this tenant");
    }

    // Dynamic config from DB
    const config = {
        host: process.env.ONDC_STAGING_HOST || "https://staging.gateway.ondc.org",
        bapId: process.env.BAP_ID || "pincode.com", // Example BAP
        bapUri: process.env.BAP_URI || "https://pincode.com/ondc/",
        bppId: agg.subscriberId,
        bppUri: agg.bppUri || `${process.env.APP_URL || 'http://localhost:5001'}/api/ondc/`,
        country: "IND",
        city: agg.cityCode || "std:080",
        ttl: "PT30M",
        domain: agg.domain || "RET11"
    };

    return new ONDC(config);
};

module.exports = { getOndcInstance };
