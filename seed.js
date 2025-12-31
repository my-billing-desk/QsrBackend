const {
    sequelize, User, Category, Item, Variant, VariationGroup,
    RawMaterial, Supplier, Purchase, PurchaseItem,
    Recipe, RecipeIngredient, Order, OrderItem, Tax, Outlet, Tenant, Addon, AddonGroup, ItemAddonGroup, ItemVariationGroup, Aggregator, Role
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
        console.log(`[SEED] Created/Found Tenant "Sunburst Stack" with ID: ${tenantId}`);

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
        console.log(`[SEED] Created/Found Tenant "Trial Coffee Shop" with ID: ${trialTenant.id}`);

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

        // 1.1 Outlet (Linked to Sunburst Tenant)
        console.log('Seeding Outlet for Sunburst...');
        await Outlet.create({
            name: 'Sunburst Main Outlet',
            email: 'main@sunburst.com',
            address: '123 Tech Park, Innovation Way',
            country: 'India',
            state: 'Karnataka',
            city: 'Bengaluru',
            tenantId: tenantId,
            themeName: 'Midnight Emerald (Dark)',
            themeColor: '#34D399',
            themePalette: JSON.stringify({
                id: 'midnight_emerald',
                name: 'Midnight Emerald (Dark)',
                colors: ['#34D399', '#0F172A', '#1E293B', '#F8FAFC', '#020617'],
                isPro: true,
                type: 'dark',
                settings: {
                    '--bg-main': '#0F172A',
                    '--bg-surface': '#1E293B',
                    '--bg-sidebar': '#020617',
                    '--bg-header': '#0F172A',
                    '--text-main': '#F8FAFC',
                    '--text-muted': '#94A3B8',
                    '--color-primary': '#34D399',
                    '--color-primary-hover': '#10B981',
                    '--color-secondary': '#64748B',
                    '--status-success': '#22C55E',
                    '--status-warning': '#F59E0B',
                    '--status-error': '#EF4444',
                    '--status-info': '#3B82F6',
                    '--border-color': '#334155',
                    '--sidebar-active': 'rgba(52, 211, 153, 0.1)',
                    '--sidebar-active-text': '#34D399',
                    '--sidebar-text': '#94A3B8',
                    '--pos-btn-pay': '#34D399',
                    '--pos-btn-hold': '#F59E0B',
                    '--pos-btn-save': '#64748B',
                    '--pos-btn-cancel': '#EF4444',
                    '--chart-1': '#34D399',
                    '--chart-2': '#3B82F6',
                    '--chart-3': '#8B5CF6',
                    '--chart-4': '#64748B',
                    '--chart-5': '#EC4899',
                }
            })
        });
        console.log('[SEED] Outlet Seeding Successfully Created');

        // 1.2 Roles
        console.log('Seeding Roles...');
        const createDefaultRoles = async (tid) => {
            const roles = [
                { name: 'super_admin', description: 'System Owner' },
                { name: 'admin', description: 'Restaurant Manager' },
                { name: 'cashier', description: 'Counter Staff' },
                { name: 'kitchen', description: 'KDS Access' },
                { name: 'captain', description: 'Waiter/Captain App' }
            ];
            const createdRoles = {};
            for (const r of roles) {
                const role = await Role.create({ ...r, tenantId: tid, permissions: [] }); // Start with empty array, Admin can configure in UI
                createdRoles[r.name] = role.id;
            }
            return createdRoles;
        };

        const sunburstRoles = await createDefaultRoles(tenantId);
        const trialRoles = await createDefaultRoles(trialTenant.id);
        const expiredRoles = await createDefaultRoles(expiredTenant.id);

        // 2. Users (Super Admin, Manager, Cashier, Kitchen)
        console.log(`Seeding Users for TenantID: ${tenantId}...`);

        // Super Admin
        await User.create({
            username: 'guna',
            password: 'king123',
            passcode: '1111',
            roleId: sunburstRoles['super_admin'],
            displayName: 'Super Admin',
            email: 'sunburststack@gmail.com',
            tenantId: tenantId
        });

        // Admin
        await User.create({
            username: 'admin',
            password: 'admin123',
            passcode: '2222',
            roleId: sunburstRoles['admin'],
            displayName: 'Restaurant Admin',
            tenantId: tenantId
        });

        // Trial Tenant User
        await User.create({
            username: 'trialuser',
            password: '123',
            passcode: '0000',
            roleId: trialRoles['super_admin'],
            displayName: 'Trial User',
            email: 'trial@trialshop.com',
            tenantId: trialTenant.id
        });

        // Expired Tenant User
        await User.create({
            username: 'expireduser',
            password: '123',
            passcode: '9999',
            roleId: expiredRoles['super_admin'],
            displayName: 'Expired User',
            email: 'expired@expiredshop.com',
            tenantId: expiredTenant.id
        });

        // Cashier
        await User.create({
            username: 'cashier',
            password: '123',
            passcode: '2024',
            roleId: sunburstRoles['cashier'],
            displayName: 'Cashier 1',
            email: 'cashier@sunburst.com',
            tenantId: tenantId
        });

        // Kitchen
        await User.create({
            username: 'kitchen',
            password: '123',
            passcode: '3030',
            roleId: sunburstRoles['kitchen'],
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
        await Aggregator.create({
            name: 'ONDC',
            slug: 'ondc',
            isConnected: false,
            icon: 'https://upload.wikimedia.org/wikipedia/commons/2/29/ONDC_Official_Logo.svg',
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
