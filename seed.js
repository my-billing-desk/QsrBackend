const {
    sequelize, User, Category, Item, Variant, VariationGroup,
    RawMaterial, Supplier, Purchase, PurchaseItem,
    Recipe, RecipeIngredient, Order, OrderItem, Tax, Outlet, Tenant, Addon, AddonGroup, ItemAddonGroup, ItemVariationGroup, Aggregator
} = require('./src/models');
const bcrypt = require('bcryptjs');

async function seed() {
    try {
        await sequelize.sync({ force: true }); // Wipe and recreate for clean seed

        console.log('--- Starting Seed ---');

        // 1. Tenant
        console.log('Seeding Tenant...');

        // Tenant 1: Active Enterprise (Expiry in 365 days)
        const [tenant] = await Tenant.findOrCreate({
            where: { subdomain: 'sunburst' },
            defaults: {
                name: 'Sunburst Stack',
                status: 'active',
                subscriptionPlan: 'enterprise',
                subscriptionExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 Year from now
            }
        });
        const tenantId = tenant.id;

        // Tenant 2: Trial User (Expiry in 7 days) - For testing
        const [trialTenant] = await Tenant.findOrCreate({
            where: { subdomain: 'trialshop' },
            defaults: {
                name: 'Trial Coffee Shop',
                status: 'trial',
                subscriptionPlan: 'starter',
                subscriptionExpiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });

        // Tenant 3: Expired Trial (Onboard Pending) - For testing
        const [expiredTenant] = await Tenant.findOrCreate({
            where: { subdomain: 'expiredshop' },
            defaults: {
                name: 'Expired Pizza Place',
                status: 'onboard_pending',
                subscriptionPlan: 'starter',
                subscriptionExpiryDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // Expired yesterday
            }
        });

        // 2. Users (Super Admin, Manager, Cashier, Kitchen)
        console.log('Seeding Users...');

        // Super Admin
        await User.create({
            username: 'guna',
            password: 'king123',
            passcode: '1111',
            role: 'super_admin',
            displayName: 'Super Admin',
            email: 'guna.swtkiller@gmail.com',
            tenantId: tenantId
        });

        // Admin
        await User.create({
            username: 'admin',
            password: 'admin123',
            passcode: '1234',
            role: 'admin',
            displayName: 'Store Manager',
            email: 'manager@sunburst.com',
            tenantId: tenantId
        });

        // Trial Tenant User
        await User.create({
            username: 'trialuser',
            password: '123',
            passcode: '0000',
            role: 'super_admin',
            displayName: 'Trial User',
            email: 'trial@trialshop.com',
            tenantId: trialTenant.id
        });

        // Expired Tenant User
        await User.create({
            username: 'expireduser',
            password: '123',
            passcode: '9999',
            role: 'super_admin',
            displayName: 'Expired User',
            email: 'expired@expiredshop.com',
            tenantId: expiredTenant.id
        });

        // Cashier
        await User.create({
            username: 'cashier',
            password: '123',
            passcode: '2024',
            role: 'cashier',
            displayName: 'Cashier 1',
            email: 'cashier@sunburst.com',
            tenantId: tenantId
        });

        // Kitchen
        await User.create({
            username: 'kitchen',
            password: '123',
            passcode: '3030',
            role: 'kitchen',
            displayName: 'Head Chef',
            email: 'chef@sunburst.com',
            tenantId: tenantId
        });


        // 3. Raw Materials (Inventory)
        console.log('Seeding Inventory...');
        const bun = await RawMaterial.create({
            name: 'Burger Bun',
            purchaseUnit: 'Pieces',
            consumptionUnit: 'Pieces',
            conversionFactor: 1,
            purchasePrice: 5.00,
            currentStock: 100,
            minStockLevel: 20,
            tenantId
        });
        const cheese = await RawMaterial.create({
            name: 'Cheese Slice',
            purchaseUnit: 'Pack',
            consumptionUnit: 'Slice',
            conversionFactor: 20, // 20 slices per pack
            purchasePrice: 100.00, // Pack price
            currentStock: 10, // Packs
            minStockLevel: 2,
            tenantId
        });
        const chickenPatty = await RawMaterial.create({
            name: 'Chicken Patty',
            purchaseUnit: 'Pack',
            consumptionUnit: 'Pieces',
            conversionFactor: 10,
            purchasePrice: 150.00,
            currentStock: 8,
            minStockLevel: 2,
            tenantId
        });
        const flour = await RawMaterial.create({
            name: 'Pizza Flour',
            purchaseUnit: 'Kg',
            consumptionUnit: 'Gram',
            conversionFactor: 1000,
            purchasePrice: 40.00,
            currentStock: 50,
            minStockLevel: 10,
            tenantId
        });
        const tomato = await RawMaterial.create({
            name: 'Tomato',
            purchaseUnit: 'Kg',
            consumptionUnit: 'Gram',
            conversionFactor: 1000,
            purchasePrice: 20.00,
            currentStock: 20,
            minStockLevel: 5,
            tenantId
        });
        const mozzarella = await RawMaterial.create({
            name: 'Mozzarella Cheese',
            purchaseUnit: 'Kg',
            consumptionUnit: 'Gram',
            conversionFactor: 1000,
            purchasePrice: 350.00,
            currentStock: 15,
            minStockLevel: 5,
            tenantId
        });

        // 4. Categories
        console.log('Seeding Categories...');
        const catBurgers = await Category.create({ name: 'Burgers', icon: 'burger', tenantId });
        const catPizza = await Category.create({ name: 'Pizza', icon: 'pizza', tenantId });
        const catBeverages = await Category.create({ name: 'Beverages', icon: 'drink', tenantId });

        // 5. Variation Groups & Addon Groups
        console.log('Seeding Groups...');
        const sizeGroup = await VariationGroup.create({ name: 'Size', description: 'Size of the item', tenantId });
        const crustGroup = await VariationGroup.create({ name: 'Crust', description: 'Type of crust', tenantId });

        const toppingsGroup = await AddonGroup.create({ name: 'Toppings', description: 'Extra toppings', minSelection: 0, maxSelection: 5, tenantId });

        // Addons
        await Addon.create({ name: 'Extra Cheese', price: 20, addonGroupId: toppingsGroup.id, tenantId });
        await Addon.create({ name: 'Mushrooms', price: 15, addonGroupId: toppingsGroup.id, tenantId });
        await Addon.create({ name: 'Olives', price: 15, addonGroupId: toppingsGroup.id, tenantId });


        // 6. Items
        console.log('Seeding Items...');

        // -- Classic Chicken Burger
        const burger = await Item.create({
            name: 'Classic Chicken Burger',
            price: 150,
            description: 'Juicy chicken patty with fresh lettuce and mayo.',
            shortCode: 'CB01',
            categoryId: catBurgers.id,
            type: 'non-veg',
            tenantId
        });

        // Recipe for Burger
        const burgerRecipe = await Recipe.create({ itemId: burger.id, tenantId });
        await RecipeIngredient.create({ recipeId: burgerRecipe.id, rawMaterialId: bun.id, quantity: 1, unit: 'Pieces', tenantId });
        await RecipeIngredient.create({ recipeId: burgerRecipe.id, rawMaterialId: chickenPatty.id, quantity: 1, unit: 'Pieces', tenantId });
        await RecipeIngredient.create({ recipeId: burgerRecipe.id, rawMaterialId: cheese.id, quantity: 1, unit: 'Slice', tenantId });


        // -- Margherita Pizza
        const pizza = await Item.create({
            name: 'Margherita Pizza',
            price: 250,
            description: 'Classic cheese and tomato pizza.',
            shortCode: 'MP01',
            categoryId: catPizza.id,
            type: 'veg',
            tenantId
        });

        // Variations for Pizza
        await ItemVariationGroup.create({ itemId: pizza.id, variationGroupId: sizeGroup.id, tenantId });
        await Variant.create({ name: 'Regular', price: 250, variationGroupId: sizeGroup.id, itemId: pizza.id, tenantId });
        await Variant.create({ name: 'Medium', price: 350, variationGroupId: sizeGroup.id, itemId: pizza.id, tenantId });
        await Variant.create({ name: 'Large', price: 490, variationGroupId: sizeGroup.id, itemId: pizza.id, tenantId });

        // Addons for Pizza
        await ItemAddonGroup.create({ itemId: pizza.id, addonGroupId: toppingsGroup.id, tenantId });

        // -- Coke
        await Item.create({
            name: 'Coca Cola',
            price: 40,
            description: 'Chilled soft drink',
            shortCode: 'BV01',
            categoryId: catBeverages.id,
            type: 'veg',
            tenantId
        });


        // 7. Suppliers
        console.log('Seeding Suppliers...');
        await Supplier.create({
            name: 'Fresh Farms Ltd',
            contactPerson: 'Ramesh',
            phone: '9876543210',
            email: 'supply@freshfarms.com',
            address: '123, Market Yard',
            tenantId
        });

        // 8. Taxes
        await Tax.create({ name: 'GST', percentage: 5, tenantId });

        // 9. Orders (Sample Data)
        console.log('Seeding Orders...');
        const order1 = await Order.create({
            orderNumber: 'ORD-1001',
            customerName: 'John Doe',
            customerPhone: '9988776655',
            type: 'dine-in', // Fixed Enum value
            status: 'completed',
            paymentStatus: 'paid',
            taxAmount: 20,
            discount: 0, // Corrected field name
            totalAmount: 420, // 150 + 250 + 20 tax
            tenantId,
            items: [
                { itemId: burger.id, itemName: burger.name, quantity: 1, price: 150, total: 150, tenantId },
                { itemId: pizza.id, itemName: pizza.name, quantity: 1, price: 250, total: 250, tenantId }
            ]
        }, {
            include: [{ model: OrderItem, as: 'items' }]
        });


        // 10. Aggregators
        console.log('Seeding Aggregators...');
        await Aggregator.create({
            name: 'Zomato',
            slug: 'zomato',
            isConnected: true,
            icon: 'https://upload.wikimedia.org/wikipedia/commons/b/bd/Zomato_Logo.png',
            tenantId
        });
        await Aggregator.create({
            name: 'Swiggy',
            slug: 'swiggy',
            isConnected: true,
            icon: 'https://upload.wikimedia.org/wikipedia/commons/1/13/Swiggy_logo.png',
            tenantId
        });

        // 11. Online Orders (Sample)
        console.log('Seeding Online Orders...');
        await Order.create({
            orderNumber: 'ZOM-8821',
            customerName: 'Alice Smith',
            customerPhone: '9898989898',
            type: 'delivery',
            source: 'Zomato',
            status: 'placed',
            paymentStatus: 'paid',
            totalAmount: 315,
            tenantId,
            items: [
                { itemId: pizza.id, itemName: 'Margherita Pizza (Regular)', quantity: 1, price: 250, total: 250, tenantId },
                { itemId: burger.id, itemName: 'Classic Burger', quantity: 1, price: 50, total: 50, tenantId }
            ]
        }, { include: [{ model: OrderItem, as: 'items' }] });

        await Order.create({
            orderNumber: 'SWI-9912',
            customerName: 'Bob Vance',
            customerPhone: '9797979797',
            type: 'delivery',
            source: 'Swiggy',
            status: 'preparing',
            paymentStatus: 'paid',
            totalAmount: 190,
            tenantId,
            items: [
                { itemId: burger.id, itemName: 'Classic Chicken Burger', quantity: 1, price: 150, total: 150, tenantId },
                { itemId: 3, itemName: 'Coca Cola', quantity: 1, price: 40, total: 40, tenantId }
            ]
        }, { include: [{ model: OrderItem, as: 'items' }] });

        console.log('--- Seed Completed Successfully ---');
        process.exit(0);

    } catch (error) {
        console.error('Seed failed:', error);
        console.error(error.stack);
        process.exit(1);
    }
}

seed();
