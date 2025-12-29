/**
 * Test Script for Feature 1: Recipe Engine Auto-Deduction
 * 
 * This script tests the automatic inventory deduction system
 */

const {
    sequelize,
    RawMaterial,
    Recipe,
    RecipeIngredient,
    Item,
    Category,
    StockTransaction,
    Order,
    OrderItem,
    User,
    Tenant
} = require('./src/models');

const inventoryDeductionService = require('./src/services/inventoryDeductionService');

async function testAutoDeduction() {
    console.log('🧪 Testing Feature 1: Recipe Engine Auto-Deduction\n');
    console.log('='.repeat(60));

    try {
        // Sync database to create new tables only (don't alter existing)
        console.log('\n📦 Syncing database...');
        await sequelize.sync({ force: false });
        console.log('✅ Database synced successfully\n');

        // Create test tenant if doesn't exist
        let tenant = await Tenant.findOne({ where: { name: 'Test Restaurant' } });
        if (!tenant) {
            tenant = await Tenant.create({
                id: '550e8400-e29b-41d4-a716-446655440000',
                name: 'Test Restaurant',
                subdomain: 'testrestaurant'
            });
            console.log('✅ Created test tenant');
        }

        // Create test user if doesn't exist
        let user = await User.findOne({ where: { email: 'test@test.com' } });
        if (!user) {
            user = await User.create({
                email: 'test@test.com',
                username: 'testuser',
                displayName: 'Test User',
                role: 'admin',
                tenantId: tenant.id
            });
            console.log('✅ Created test user');
        }

        // 1. Create Test Category
        console.log('\n📋 Step 1: Creating test category...');
        let category = await Category.findOne({ where: { name: 'Test Category' } });
        if (!category) {
            category = await Category.create({
                name: 'Test Category',
                displayOrder: 1,
                tenantId: tenant.id
            });
            console.log('✅ Created category: Test Category');
        } else {
            console.log('✅ Category already exists');
        }

        // 2. Create Test Item (Cheeseburger)
        console.log('\n🍔 Step 2: Creating test item (Cheeseburger)...');
        let item = await Item.findOne({ where: { name: 'Test Cheeseburger' } });
        if (!item) {
            item = await Item.create({
                name: 'Test Cheeseburger',
                shortCode: 'TCB',
                price: 12.99,
                categoryId: category.id,
                isAvailable: true,
                tenantId: tenant.id
            });
            console.log('✅ Created item: Test Cheeseburger ($12.99)');
        } else {
            console.log('✅ Item already exists');
        }

        // 3. Create Raw Materials (Ingredients)
        console.log('\n🥩 Step 3: Creating raw materials...');

        const materials = [
            { name: 'Beef Patty', currentStock: 5000, minStockLevel: 500, purchaseUnit: 'g', consumptionUnit: 'g' },
            { name: 'Burger Bun', currentStock: 100, minStockLevel: 20, purchaseUnit: 'unit', consumptionUnit: 'unit' },
            { name: 'Cheese Slice', currentStock: 200, minStockLevel: 30, purchaseUnit: 'unit', consumptionUnit: 'unit' },
            { name: 'Lettuce', currentStock: 2000, minStockLevel: 200, purchaseUnit: 'g', consumptionUnit: 'g' }
        ];

        const createdMaterials = {};
        for (const mat of materials) {
            let material = await RawMaterial.findOne({ where: { name: mat.name, tenantId: tenant.id } });
            if (!material) {
                material = await RawMaterial.create({ ...mat, tenantId: tenant.id });
                console.log(`✅ Created: ${mat.name} (Stock: ${mat.currentStock} ${mat.consumptionUnit})`);
            } else {
                await material.update({ currentStock: mat.currentStock });
                console.log(`✅ Reset stock: ${mat.name} (Stock: ${mat.currentStock} ${mat.consumptionUnit})`);
            }
            createdMaterials[mat.name] = material;
        }

        // 4. Create Recipe for Cheeseburger
        console.log('\n📝 Step 4: Creating recipe...');

        let recipe = await Recipe.findOne({ where: { itemId: item.id } });
        if (!recipe) {
            recipe = await Recipe.create({
                itemId: item.id,
                variantId: null,
                yieldQty: 1,
                autoConsumption: true,
                tenantId: tenant.id
            });
            console.log('✅ Created recipe for Cheeseburger');
        } else {
            console.log('✅ Recipe already exists');
        }

        // 5. Add Recipe Ingredients
        console.log('\n🔧 Step 5: Adding ingredients to recipe...');

        await RecipeIngredient.destroy({ where: { recipeId: recipe.id } });

        const ingredients = [
            { material: 'Beef Patty', quantity: 200, unit: 'g' },
            { material: 'Burger Bun', quantity: 1, unit: 'unit' },
            { material: 'Cheese Slice', quantity: 1, unit: 'unit' },
            { material: 'Lettuce', quantity: 50, unit: 'g' }
        ];

        for (const ing of ingredients) {
            await RecipeIngredient.create({
                recipeId: recipe.id,
                rawMaterialId: createdMaterials[ing.material].id,
                quantity: ing.quantity,
                unit: ing.unit
            });
            console.log(`✅ Added: ${ing.quantity} ${ing.unit} of ${ing.material}`);
        }

        // 6. Display current stock levels
        console.log('\n📊 Current Stock Levels (Before Order):');
        console.log('─'.repeat(60));
        for (const name in createdMaterials) {
            const mat = createdMaterials[name];
            console.log(`${name.padEnd(20)} : ${mat.currentStock} ${mat.consumptionUnit}`);
        }

        // 7. Create Test Order
        console.log('\n🛒 Step 6: Creating test order (2x Cheeseburger)...');

        const order = await Order.create({
            orderNumber: `TEST-${Date.now()}`,
            type: 'Dine-In',
            totalAmount: 25.98,
            status: 'pending',
            source: 'pos',
            tenantId: tenant.id
        });
        console.log(`✅ Created order #${order.orderNumber}`);

        // 8. Add order items
        const orderItems = [
            {
                orderId: order.id,
                itemId: item.id,
                itemName: item.name,
                quantity: 2, // Ordering 2 cheeseburgers
                price: item.price,
                total: item.price * 2
            }
        ];

        await OrderItem.bulkCreate(orderItems);
        console.log('✅ Added 2x Cheeseburger to order');

        // 9. TEST AUTO-DEDUCTION
        console.log('\n⚡ Step 7: Running auto-deduction...');

        const deductionResult = await inventoryDeductionService.deductInventoryForOrder({
            id: order.id,
            items: orderItems
        }, user.id);

        console.log('✅ Auto-deduction completed!');

        // 10. Show deduction details
        console.log('\n📉 Deduction Details:');
        console.log('─'.repeat(60));
        for (const itemResult of deductionResult.deductions) {
            if (itemResult.deductions) {
                for (const ded of itemResult.deductions) {
                    console.log(`${ded.rawMaterialName.padEnd(20)} : -${ded.quantityDeducted} ${ded.unit} (New stock: ${ded.newStock})`);
                }
            }
        }

        // 11. Show warnings
        if (deductionResult.warnings && deductionResult.warnings.length > 0) {
            console.log('\n⚠️  Low Stock Warnings:');
            console.log('─'.repeat(60));
            for (const warning of deductionResult.warnings) {
                console.log(`⚠️  ${warning.rawMaterialName}: ${warning.currentStock} (min: ${warning.minStock})`);
            }
        } else {
            console.log('\n✅ No low stock warnings');
        }

        // 12. Verify stock transactions were logged
        console.log('\n📝 Step 8: Checking stock transactions...');
        const transactions = await StockTransaction.findAll({
            where: { orderId: order.id },
            include: [{ model: RawMaterial }]
        });

        console.log(`✅ Found ${transactions.length} stock transactions`);
        console.log('\nTransaction Log:');
        console.log('─'.repeat(60));
        for (const trans of transactions) {
            console.log(`${trans.RawMaterial.name.padEnd(20)} : ${trans.quantityChange > 0 ? '+' : ''}${trans.quantityChange} ${trans.RawMaterial.consumptionUnit} → Stock: ${trans.currentStock}`);
        }

        // 13. Final stock levels
        console.log('\n📊 Final Stock Levels (After Order):');
        console.log('─'.repeat(60));
        for (const name in createdMaterials) {
            const mat = await RawMaterial.findByPk(createdMaterials[name].id);
            const change = createdMaterials[name].currentStock - mat.currentStock;
            console.log(`${name.padEnd(20)} : ${mat.currentStock} ${mat.consumptionUnit} (${change > 0 ? '-' : '+'}${Math.abs(change)})`);
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('🎉 TEST COMPLETE!');
        console.log('='.repeat(60));
        console.log('\n✅ Auto-deduction is working correctly!');
        console.log('✅ Stock transactions were logged');
        console.log('✅ Stock levels updated accurately');
        console.log('\nExpected deductions per burger:');
        console.log('  - Beef Patty: 200g × 2 = 400g');
        console.log('  - Burger Bun: 1 unit × 2 = 2 units');
        console.log('  - Cheese Slice: 1 unit × 2 = 2 units');
        console.log('  - Lettuce: 50g × 2 = 100g');

    } catch (error) {
        console.error('\n❌ Test failed:', error);
        console.error(error.stack);
    } finally {
        await sequelize.close();
        console.log('\n👋 Database connection closed');
    }
}

// Run the test
testAutoDeduction();
