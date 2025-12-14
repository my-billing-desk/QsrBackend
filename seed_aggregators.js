const { Aggregator, sequelize } = require('./src/models');

async function seedAggregators() {
    try {
        await sequelize.sync(); // Ensure table exists

        const aggregators = [
            { name: 'Zomato', slug: 'zomato', isConnected: true, icon: 'https://b.zmtcdn.com/images/logo/zomato_logo_2017.png' },
            { name: 'Swiggy', slug: 'swiggy', isConnected: true, icon: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/12/Swiggy_logo.svg/1200px-Swiggy_logo.svg.png' },
            { name: 'MagicPin', slug: 'magicpin', isConnected: false },
            { name: 'Bromag', slug: 'bromag', isConnected: false },
            { name: 'Dotpe', slug: 'dotpe', isConnected: false },
            { name: 'Thrive', slug: 'thrive', isConnected: false }
        ];

        for (const agg of aggregators) {
            await Aggregator.findOrCreate({
                where: { slug: agg.slug },
                defaults: agg
            });
        }

        console.log('Aggregators seeded!');
    } catch (e) {
        console.error(e);
    }
}

seedAggregators();
