const { Outlet, sequelize } = require('./src/models');

async function debugUpdate() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // Sync to ensure schema is updated (in case server didn't do it yet)
        await sequelize.sync();
        console.log('DB Synced');

        const tenantId = null;
        const updateData = {
            themeName: "Nordic Frost (Light)",
            themeColor: "#6366F1",
            themePalette: JSON.stringify({
                id: "nordic_frost",
                name: "Nordic Frost (Light)",
                colors: ["#6366F1", "#1E293B", "#F1F5F9", "#475569", "#FFFFFF"],
                isPro: true,
                type: "light",
                settings: {
                    "--bg-main": "#F1F5F9",
                    "--bg-surface": "#FFFFFF",
                    "--bg-sidebar": "#FFFFFF",
                    "--bg-header": "#FFFFFF",
                    "--text-main": "#0F172A",
                    "--text-muted": "#64748B",
                    "--color-primary": "#6366F1",
                    "--color-primary-hover": "#4F46E5",
                    "--color-secondary": "#94A3B8",
                    "--status-success": "#10B981",
                    "--status-warning": "#F59E0B",
                    "--status-error": "#E11D48",
                    "--status-info": "#0EA5E9",
                    "--border-color": "#E2E8F0",
                    "--sidebar-active": "#EEF2FF",
                    "--sidebar-active-text": "#6366F1",
                    "--sidebar-text": "#64748B",
                    "--pos-btn-pay": "#6366F1",
                    "--pos-btn-hold": "#F59E0B",
                    "--pos-btn-save": "#1E293B",
                    "--pos-btn-cancel": "#E11D48",
                    "--chart-1": "#6366F1",
                    "--chart-2": "#0EA5E9",
                    "--chart-3": "#F43F5E",
                    "--chart-4": "#FB923C",
                    "--chart-5": "#8B5CF6"
                }
            }),
            tenantId: tenantId
        };

        console.log('Searching for outlet with tenantId:', tenantId);
        let outlet = await Outlet.findOne({ where: { tenantId } });

        if (outlet) {
            console.log('Outlet found, updating...');
            await outlet.update(updateData);
        } else {
            console.log('Outlet not found, creating...');
            // We need to provide required fields: name
            updateData.name = 'Global Outlet Config';
            outlet = await Outlet.create(updateData);
        }

        console.log('Success:', outlet.toJSON());

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

debugUpdate();
