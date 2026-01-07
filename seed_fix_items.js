const {
    sequelize, Category, Item, Variant, VariationGroup,
    Addon, AddonGroup, ItemAddonGroup, ItemVariationGroup
} = require('./src/models');

const TENANT_ID = '3f353c0f-5326-401f-b673-59b875640aee';

async function seedFixed() {
    try {
        console.log('--- Starting Fix Seed ---');

        // 1. Categories (Ensure they exist)
        const [catBurgers] = await Category.findOrCreate({ where: { name: 'Burgers', tenantId: TENANT_ID }, defaults: { icon: 'burger' } });
        const [catPizza] = await Category.findOrCreate({ where: { name: 'Pizza', tenantId: TENANT_ID }, defaults: { icon: 'pizza' } });
        const [catBeverages] = await Category.findOrCreate({ where: { name: 'Beverages', tenantId: TENANT_ID }, defaults: { icon: 'drink' } });

        console.log('Categories Ready:', catBurgers.id, catPizza.id, catBeverages.id);

        // 2. Groups
        const [sizeGroup] = await VariationGroup.findOrCreate({ where: { name: 'Size', tenantId: TENANT_ID }, defaults: { description: 'Size of the item' } });
        const [toppingsGroup] = await AddonGroup.findOrCreate({ where: { name: 'Toppings', tenantId: TENANT_ID }, defaults: { minSelection: 0, maxSelection: 5 } });

        // Addons
        await Addon.findOrCreate({ where: { name: 'Extra Cheese', addonGroupId: toppingsGroup.id, tenantId: TENANT_ID }, defaults: { price: 20 } });
        await Addon.findOrCreate({ where: { name: 'Mushrooms', addonGroupId: toppingsGroup.id, tenantId: TENANT_ID }, defaults: { price: 15 } });
        await Addon.findOrCreate({ where: { name: 'Olives', addonGroupId: toppingsGroup.id, tenantId: TENANT_ID }, defaults: { price: 15 } });

        // 3. Items

        // -- Classic Chicken Burger
        const [burger, burgerCreated] = await Item.findOrCreate({
            where: { name: 'Classic Chicken Burger', tenantId: TENANT_ID },
            defaults: {
                price: 150,
                description: 'Juicy chicken patty with fresh lettuce and mayo.',
                shortCode: 'CB01',
                categoryId: catBurgers.id,
                type: 'non-veg',
                availableOffline: true,
                isAvailable: true
            }
        });
        if (burgerCreated) console.log('Created Burger');

        // -- Margherita Pizza
        const [pizza, pizzaCreated] = await Item.findOrCreate({
            where: { name: 'Margherita Pizza', tenantId: TENANT_ID },
            defaults: {
                price: 250,
                description: 'Classic cheese and tomato pizza.',
                shortCode: 'MP01',
                categoryId: catPizza.id,
                type: 'veg',
                availableOffline: true,
                isAvailable: true
            }
        });
        if (pizzaCreated) console.log('Created Pizza');

        if (pizzaCreated) {
            // Variations for Pizza
            await ItemVariationGroup.create({ itemId: pizza.id, variationGroupId: sizeGroup.id, tenantId: TENANT_ID });
            await Variant.create({ name: 'Regular', price: 250, variationGroupId: sizeGroup.id, itemId: pizza.id, tenantId: TENANT_ID });
            await Variant.create({ name: 'Medium', price: 350, variationGroupId: sizeGroup.id, itemId: pizza.id, tenantId: TENANT_ID });
            await Variant.create({ name: 'Large', price: 490, variationGroupId: sizeGroup.id, itemId: pizza.id, tenantId: TENANT_ID });
            // Addons
            await ItemAddonGroup.create({ itemId: pizza.id, addonGroupId: toppingsGroup.id, tenantId: TENANT_ID });
        }

        // -- Coke
        const [coke, cokeCreated] = await Item.findOrCreate({
            where: { name: 'Coca Cola', tenantId: TENANT_ID },
            defaults: {
                price: 40,
                description: 'Chilled soft drink',
                shortCode: 'BV01',
                categoryId: catBeverages.id,
                type: 'veg',
                availableOffline: true,
                isAvailable: true
            }
        });
        if (cokeCreated) console.log('Created Coke');

        console.log('--- Seed Fix Completed ---');

    } catch (error) {
        console.error('Seed failed:', error);
    }
}

seedFixed();
