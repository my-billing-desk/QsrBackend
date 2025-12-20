const {
    sequelize, User, Category, Item, Variant,
    RawMaterial, Supplier, Purchase, PurchaseItem,
    Recipe, RecipeIngredient, Order, OrderItem, Tax, Outlet
} = require('./src/models');
const bcrypt = require('bcryptjs');

async function seed() {
    try {
        await sequelize.sync({ force: true }); // Wipe and recreate for clean seed

        console.log('--- Starting Seed ---');

        // 1. Users
        const adminExists = await User.findOne({ where: { username: 'guna' } });
        if (!adminExists) {
            console.log('Seeding default admin user...');
            await User.create({
                username: 'guna',
                password: 'king123',
                role: 'super_admin',
                displayName: 'Super Admin',
                email: 'guna.swtkiller@gmail.com'
            });
        } else {
            console.log('Admin user exists.');
        }

        // 2. Categories
        console.log('Seeding Categories...');
        const catBeverages = await Category.create({ name: 'Beverages', icon: '🥤', sortOrder: 1, station: 'Bar' });
        const catStarters = await Category.create({ name: 'Starters', icon: '🍟', sortOrder: 2, station: 'Kitchen' }); // Default
        const catMainCourse = await Category.create({ name: 'Main Course', icon: '🍛', sortOrder: 3, station: 'Kitchen' });
        const catBreads = await Category.create({ name: 'Breads', icon: '🍞', sortOrder: 4, station: 'Tandoor' });
        const catDesserts = await Category.create({ name: 'Desserts', icon: '🍰', sortOrder: 5, station: 'Kitchen' });
        const catPizzas = await Category.create({ name: 'Pizzas', icon: '🍕', sortOrder: 6, station: 'Kitchen' });
        const catChinese = await Category.create({ name: 'Chinese', icon: '🥢', sortOrder: 7, station: 'Chinese' });
        const catSouthIndian = await Category.create({ name: 'South Indian', icon: '🥘', sortOrder: 8, station: 'Kitchen' });
        const catShakes = await Category.create({ name: 'Shakes', icon: '🥤', sortOrder: 9, station: 'Bar' });
        const catBurgers = await Category.create({ name: 'Burgers', icon: '🍔', sortOrder: 10, station: 'Kitchen' });
        const catTandoorStarters = await Category.create({ name: 'Tandoor Starters', icon: '🍗', sortOrder: 11, station: 'Tandoor' });

        console.log('Seeding Raw Materials...');
        // Inferring ingredients for the items
        const materialsData = [
            { name: 'Paneer', purchaseUnit: 'Kg', consumptionUnit: 'Gram', conversionFactor: 1000, purchasePrice: 400, currentStock: 50, category: 'Dairy' },
            { name: 'Wrap Base', purchaseUnit: 'Pkt', consumptionUnit: 'Piece', conversionFactor: 10, purchasePrice: 100, currentStock: 100, category: 'Bakery' },
            { name: 'Mojito Syrup', purchaseUnit: 'Ltr', consumptionUnit: 'Milliliter', conversionFactor: 1000, purchasePrice: 200, currentStock: 20, category: 'Beverage' },
            { name: 'Lemon', purchaseUnit: 'Kg', consumptionUnit: 'Piece', conversionFactor: 10, purchasePrice: 50, currentStock: 100, category: 'Vegetable' },
            { name: 'Mint Leaves', purchaseUnit: 'Bunch', consumptionUnit: 'Gram', conversionFactor: 100, purchasePrice: 20, currentStock: 50, category: 'Vegetable' },
            { name: 'Milk', purchaseUnit: 'Ltr', consumptionUnit: 'Milliliter', conversionFactor: 1000, purchasePrice: 60, currentStock: 50, category: 'Dairy' },
            { name: 'Oreo Biscuit', purchaseUnit: 'Pkt', consumptionUnit: 'Piece', conversionFactor: 10, purchasePrice: 30, currentStock: 100, category: 'Snack' },
            { name: 'Ice Cream', purchaseUnit: 'Tub', consumptionUnit: 'Scoop', conversionFactor: 20, purchasePrice: 500, currentStock: 20, category: 'Dairy' },
            { name: 'Aloo Patty', purchaseUnit: 'Box', consumptionUnit: 'Piece', conversionFactor: 20, purchasePrice: 150, currentStock: 200, category: 'Frozen' },
            { name: 'Burger Bun', purchaseUnit: 'Pkt', consumptionUnit: 'Piece', conversionFactor: 6, purchasePrice: 40, currentStock: 100, category: 'Bakery' }
        ];

        const materials = {};
        for (const m of materialsData) {
            const [mat] = await RawMaterial.findOrCreate({ where: { name: m.name }, defaults: m });
            materials[m.name] = mat;
            // Force update stock
            if (mat.currentStock === 0) await mat.update({ currentStock: m.currentStock });
        }

        // 4. Suppliers (Keeping existing supplier for consistency, though not used in new orders)
        console.log('Seeding Suppliers...');
        const [supplier1] = await Supplier.findOrCreate({
            where: { name: 'Fresh Foods Co' },
            defaults: { contactPerson: 'Bob', phone: '1234567890', email: 'bob@fresh.com' }
        });

        // 5. Menu Items (Matching Screenshots)
        console.log('Seeding Menu Items...');

        // Spicy Paneer Wrap (141.90)
        const [paneerWrap] = await Item.findOrCreate({
            where: { name: 'Spicy Paneer Wrap' },
            defaults: { categoryId: catStarters.id, price: 141.90, shortCode: 'SPW', isVeg: true, description: 'Spicy delight' }
        });

        // Aloo Tikki Burger (37.14)
        const [alooTikki] = await Item.findOrCreate({
            where: { name: 'Aloo Tikki Burger' },
            defaults: { categoryId: catBurgers.id, price: 37.14, shortCode: 'ATB', isVeg: true }
        });

        // Veg Wrap (120.00) - Mapped to Burgers for now or create Wraps if needed. Let's map to 'Starters' as per new list or Burgers.
        // Actually, user had Wraps before. Let's map to 'Starters' to be safe and simple.
        const [vegWrap] = await Item.findOrCreate({
            where: { name: 'Veg Wrap' },
            defaults: { categoryId: catStarters.id, price: 120.00, shortCode: 'VWRAP', isVeg: true }
        });

        // Coke 250ml (19.05)
        const [coke] = await Item.findOrCreate({
            where: { name: 'Coke 250ml' },
            defaults: { categoryId: catBeverages.id, price: 19.05, shortCode: 'COKE', isVeg: true }
        });

        // Blue Curacao Mojito (46.67)
        const [blueMojito] = await Item.findOrCreate({
            where: { name: 'Blue Curacao Mojito' },
            defaults: { categoryId: catBeverages.id, price: 46.67, shortCode: 'BCM', isVeg: true }
        });

        // Lemon Mint Mojito (46.67)
        const [lemonMojito] = await Item.findOrCreate({
            where: { name: 'Lemon Mint Mojito' },
            defaults: { categoryId: catBeverages.id, price: 46.67, shortCode: 'LMM', isVeg: true }
        });

        // Oreo Shake (108.57)
        const [oreoShake] = await Item.findOrCreate({
            where: { name: 'Oreo Shake' },
            defaults: { categoryId: catShakes.id, price: 108.57, shortCode: 'OREO', isVeg: true }
        });

        // Aloo Tikki Burger Combos (119.00)
        const [alooBurger] = await Item.findOrCreate({
            where: { name: 'Aloo Tikki Burger Combos' },
            defaults: { categoryId: catBurgers.id, price: 119.00, shortCode: 'ATBC', isVeg: true }
        });


        // 6. Recipes (Linking Items to Materials)
        console.log('Seeding Recipes...');

        const paneerWrapRecipe = await Recipe.create({ itemId: paneerWrap.id, yieldQty: 1 });
        await RecipeIngredient.create({ recipeId: paneerWrapRecipe.id, rawMaterialId: materials['Paneer'].id, quantity: 100, unit: 'Gram' });
        await RecipeIngredient.create({ recipeId: paneerWrapRecipe.id, rawMaterialId: materials['Wrap Base'].id, quantity: 1, unit: 'Piece' });

        const blueMojitoRecipe = await Recipe.create({ itemId: blueMojito.id, yieldQty: 1 });
        await RecipeIngredient.create({ recipeId: blueMojitoRecipe.id, rawMaterialId: materials['Mojito Syrup'].id, quantity: 30, unit: 'Milliliter' });

        const lemonMojitoRecipe = await Recipe.create({ itemId: lemonMojito.id, yieldQty: 1 });
        await RecipeIngredient.create({ recipeId: lemonMojitoRecipe.id, rawMaterialId: materials['Lemon'].id, quantity: 1, unit: 'Piece' });
        await RecipeIngredient.create({ recipeId: lemonMojitoRecipe.id, rawMaterialId: materials['Mint Leaves'].id, quantity: 5, unit: 'Gram' });

        const oreoShakeRecipe = await Recipe.create({ itemId: oreoShake.id, yieldQty: 1 });
        await RecipeIngredient.create({ recipeId: oreoShakeRecipe.id, rawMaterialId: materials['Milk'].id, quantity: 200, unit: 'Milliliter' });
        await RecipeIngredient.create({ recipeId: oreoShakeRecipe.id, rawMaterialId: materials['Oreo Biscuit'].id, quantity: 2, unit: 'Piece' });

        const alooBurgerRecipe = await Recipe.create({ itemId: alooBurger.id, yieldQty: 1 });
        await RecipeIngredient.create({ recipeId: alooBurgerRecipe.id, rawMaterialId: materials['Burger Bun'].id, quantity: 1, unit: 'Piece' });
        await RecipeIngredient.create({ recipeId: alooBurgerRecipe.id, rawMaterialId: materials['Aloo Patty'].id, quantity: 1, unit: 'Piece' });

        // 7. Initial Purchases (Accession) - Not explicitly in new instructions, keeping minimal for structure
        console.log('Seeding Purchases...');
        const purchase = await Purchase.create({
            supplierId: supplier1.id,
            invoiceNumber: 'INV-SEED-001',
            invoiceDate: new Date(),
            totalAmount: 5000,
            status: 'Completed'
        });
        await PurchaseItem.create({ purchaseId: purchase.id, rawMaterialId: materials['Paneer'].id, quantity: 10, unit: 'Kg', price: 400, amount: 4000 });


        // 8. Orders (Matching Screenshots)
        console.log('Seeding Orders...');

        // Order 2504
        // Date: 13 Dec 2025 14:41:48
        // Status: Printed
        // Type: Dine In (1)
        const order2504 = await Order.create({
            orderNumber: '2504',
            source: 'POS',
            type: 'dine-in',
            status: 'served', // "Printed" mapped to valid enum
            paymentStatus: 'paid',
            customerName: '-', // Screenshot shows "-"
            totalAmount: 659.00,
            taxAmount: 31.38,
            createdAt: new Date('2025-12-13T14:41:48')
        });

        await OrderItem.create({ orderId: order2504.id, itemId: paneerWrap.id, itemName: paneerWrap.name, quantity: 3, price: 141.90, total: 425.70 });
        await OrderItem.create({ orderId: order2504.id, itemId: blueMojito.id, itemName: blueMojito.name, quantity: 1, price: 46.67, total: 46.67 });
        await OrderItem.create({ orderId: order2504.id, itemId: lemonMojito.id, itemName: lemonMojito.name, quantity: 1, price: 46.67, total: 46.67 });
        await OrderItem.create({ orderId: order2504.id, itemId: oreoShake.id, itemName: oreoShake.name, quantity: 1, price: 108.57, total: 108.57, addons: [{ name: 'Ice Cream', price: 0 }] });

        // Order 2503
        // Date: 13 Dec 2025 14:30:49
        // Type: Take Away
        const order2503 = await Order.create({
            orderNumber: '2503',
            source: 'POS',
            type: 'takeaway',
            status: 'completed',
            paymentStatus: 'paid',
            totalAmount: 119.00,
            createdAt: new Date('2025-12-13T14:30:49')
        });

        await OrderItem.create({ orderId: order2503.id, itemId: alooBurger.id, itemName: alooBurger.name, quantity: 1, price: 119.00, total: 119.00 });

        // Deduct Stock (Mocking consumption)
        // For Order 2504
        await materials['Paneer'].decrement('currentStock', { by: 300 }); // 3 wraps * 100g
        await materials['Wrap Base'].decrement('currentStock', { by: 3 });
        await materials['Mojito Syrup'].decrement('currentStock', { by: 30 }); // 1 mojito * 30ml
        await materials['Lemon'].decrement('currentStock', { by: 1 }); // 1 mojito * 1 piece
        await materials['Mint Leaves'].decrement('currentStock', { by: 5 }); // 1 mojito * 5g
        await materials['Milk'].decrement('currentStock', { by: 200 }); // 1 shake * 200ml
        await materials['Oreo Biscuit'].decrement('currentStock', { by: 2 }); // 1 shake * 2 pieces

        // For Order 2503
        await materials['Aloo Patty'].decrement('currentStock', { by: 1 }); // 1 burger * 1 piece
        await materials['Burger Bun'].decrement('currentStock', { by: 1 }); // 1 burger * 1 piece

        // 9. Outlet Configuration (Matching Screenshots)
        console.log('Seeding Outlet Configuration...');
        await Outlet.create({
            name: 'SUNBURST STACK',
            email: 'Unknown', // Not visible
            landmark: 'RAGHAVENDRA LAYOUT KEMPE GOWDA ROAD',
            zipCode: '560036',
            pinCode: '560036',
            tinNo: '',
            country: 'India',
            state: 'Karnataka',
            city: 'Bengaluru',
            timezone: 'Asia/Calcutta',
            address: 'SUNBURST STACK SURVEY NO 100/4 SHOP NO 2 SRI GURU RAGHAVENDRA LAYOUT KEMPEGOWDA ROAD GROUND FLOOR KITHAGANUR, K R Puram, Bengaluru South, Bangalore Urban, Karnataka - 560036',
            area: 'Bangalore South',
            latitude: '13.03806',
            longitude: '77.7107736637378',
            additionalInfo: '',
            cuisines: 'Select Capacity', // Placeholder from UI
            seatingCapacity: 'Select Capacity', // Placeholder from UI
            restaurantType: 'QSR',
            onlineOrderChannels: 'Zomato, Swiggy',
            fssaiLicNo: '21223180000833',
            taxAuthorityName: 'GST',
            outletServingType: 'Service',
            enableKOTForOnlineOrder: true
        });


        console.log('--- Seed Completed Successfully ---');
        process.exit(0);

    } catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    }
}

seed();
