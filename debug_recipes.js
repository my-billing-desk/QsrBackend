const { Item, Recipe, RecipeIngredient, RawMaterial } = require('./src/models');
const { Op } = require('sequelize');

async function debugRecipes() {
    try {
        const tenantId = '3f353c0f-5326-401f-b673-59b875640aee';

        console.log('--- Checking Items ---');
        const items = await Item.findAll({ where: { tenantId } });
        console.log(`Found ${items.length} items`);
        items.forEach(i => console.log(`Item: ${i.id} | ${i.name}`));

        console.log('\n--- Checking Recipes ---');
        const recipes = await Recipe.findAll({
            where: { tenantId },
            include: [
                { model: Item, attributes: ['name'] },
                { model: RecipeIngredient, include: [RawMaterial] }
            ]
        });
        console.log(`Found ${recipes.length} recipes`);
        recipes.forEach(r => {
            console.log(`Recipe for Item: ${r.Item?.name} (Item ID: ${r.itemId})`);
            console.log(`  Ingredients:`);
            r.RecipeIngredients.forEach(ri => {
                console.log(`    - ${ri.RawMaterial?.name}: ${ri.quantity} ${ri.unit}`);
            });
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

debugRecipes();
