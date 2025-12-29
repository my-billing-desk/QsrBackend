/**
 * Unit Conversion Utility
 * Handles conversions between different units of measurement
 */

const unitConversions = {
    // Mass conversions (base unit: gram)
    mass: {
        mg: 0.001,
        g: 1,
        kg: 1000,
        lb: 453.592,
        oz: 28.3495,
        ton: 1000000
    },

    // Volume conversions (base unit: milliliter)
    volume: {
        mL: 1,
        ml: 1,
        L: 1000,
        l: 1000,
        gal: 3785.41,
        qt: 946.353,
        pt: 473.176,
        cup: 236.588,
        fl_oz: 29.5735,
        tbsp: 14.7868,
        tsp: 4.92892
    },

    // Count/pieces (base unit: unit)
    count: {
        unit: 1,
        piece: 1,
        pcs: 1,
        dozen: 12,
        case: 24,
        gross: 144
    },

    // Length (base unit: meter)
    length: {
        mm: 0.001,
        cm: 0.01,
        m: 1,
        km: 1000,
        in: 0.0254,
        ft: 0.3048,
        yd: 0.9144
    }
};

/**
 * Determine the category of a unit
 */
function getUnitCategory(unit) {
    const normalizedUnit = unit.toLowerCase().trim();

    for (const [category, units] of Object.entries(unitConversions)) {
        if (units[normalizedUnit] !== undefined) {
            return category;
        }
    }

    throw new Error(`Unknown unit: ${unit}`);
}

/**
 * Convert value from one unit to another
 * @param {number} value - The value to convert
 * @param {string} fromUnit - Source unit
 * @param {string} toUnit - Target unit
 * @returns {number} - Converted value
 */
function convert(value, fromUnit, toUnit) {
    if (!value || value === 0) return 0;

    const normalizedFrom = fromUnit.toLowerCase().trim();
    const normalizedTo = toUnit.toLowerCase().trim();

    // Same unit, no conversion needed
    if (normalizedFrom === normalizedTo) {
        return value;
    }

    try {
        const fromCategory = getUnitCategory(fromUnit);
        const toCategory = getUnitCategory(toUnit);

        // Can't convert between different categories
        if (fromCategory !== toCategory) {
            throw new Error(`Cannot convert from ${fromUnit} (${fromCategory}) to ${toUnit} (${toCategory})`);
        }

        const conversions = unitConversions[fromCategory];

        // Convert to base unit, then to target unit
        const fromFactor = conversions[normalizedFrom];
        const toFactor = conversions[normalizedTo];

        const baseValue = value * fromFactor;
        const result = baseValue / toFactor;

        return result;
    } catch (error) {
        console.error('Unit conversion error:', error);
        throw error;
    }
}

/**
 * Format a quantity with its unit
 * @param {number} value - The value
 * @param {string} unit - The unit
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted string
 */
function formatQuantity(value, unit, decimals = 2) {
    return `${value.toFixed(decimals)} ${unit}`;
}

/**
 * Normalize a quantity to a standard unit system
 * @param {number} value - The value
 * @param {string} unit - Current unit
 * @param {string} system - 'metric' or 'imperial'
 * @returns {Object} - { value, unit }
 */
function normalize(value, unit, system = 'metric') {
    try {
        const category = getUnitCategory(unit);

        const standardUnits = {
            metric: {
                mass: 'kg',
                volume: 'L',
                count: 'unit',
                length: 'm'
            },
            imperial: {
                mass: 'lb',
                volume: 'gal',
                count: 'unit',
                length: 'ft'
            }
        };

        const targetUnit = standardUnits[system][category];
        const convertedValue = convert(value, unit, targetUnit);

        return {
            value: convertedValue,
            unit: targetUnit
        };
    } catch (error) {
        // If conversion fails, return original
        return { value, unit };
    }
}

/**
 * Calculate cost per base unit
 * @param {number} price - Purchase price
 * @param {number} quantity - Purchase quantity
 * @param {string} unit - Purchase unit
 * @returns {Object} - Cost per g, mL, or unit
 */
function calculateUnitCost(price, quantity, unit) {
    try {
        const category = getUnitCategory(unit);
        const baseUnits = {
            mass: 'g',
            volume: 'mL',
            count: 'unit',
            length: 'm'
        };

        const baseUnit = baseUnits[category];
        const quantityInBase = convert(quantity, unit, baseUnit);
        const costPerBase = price / quantityInBase;

        return {
            cost: costPerBase,
            unit: baseUnit,
            category
        };
    } catch (error) {
        return { cost: price / quantity, unit, category: 'unknown' };
    }
}

/**
 * Smart conversion with automatic unit detection
 * Tries to convert to the most readable unit
 */
function smartConvert(value, fromUnit) {
    try {
        const category = getUnitCategory(fromUnit);

        // Convert to base unit first
        const baseValue = convert(value, fromUnit, Object.keys(unitConversions[category])[1]);

        // Choose best display unit
        const thresholds = {
            mass: [
                { limit: 1, unit: 'mg' },
                { limit: 1000, unit: 'g' },
                { limit: Infinity, unit: 'kg' }
            ],
            volume: [
                { limit: 1, unit: 'mL' },
                { limit: 1000, unit: 'L' },
                { limit: Infinity, unit: 'L' }
            ],
            count: [
                { limit: 12, unit: 'unit' },
                { limit: 144, unit: 'dozen' },
                { limit: Infinity, unit: 'gross' }
            ]
        };

        if (thresholds[category]) {
            for (const threshold of thresholds[category]) {
                if (baseValue < threshold.limit) {
                    return {
                        value: convert(baseValue, Object.keys(unitConversions[category])[1], threshold.unit),
                        unit: threshold.unit
                    };
                }
            }
        }

        return { value: baseValue, unit: Object.keys(unitConversions[category])[1] };
    } catch (error) {
        return { value, unit: fromUnit };
    }
}

module.exports = {
    convert,
    getUnitCategory,
    formatQuantity,
    normalize,
    calculateUnitCost,
    smartConvert,
    unitConversions
};
