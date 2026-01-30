require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./src/models'); // Using the models index for relationships

const app = express();
const PORT = process.env.PORT || 5001;

// Routes Import
const menuRoutes = require('./src/routes/menuRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const authRoutes = require('./src/routes/authRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const configRoutes = require('./src/routes/configRoutes');
const settingRoutes = require('./src/routes/settingRoutes');
const groupRoutes = require('./src/routes/groupRoutes');
const inventoryRoutes = require('./src/routes/inventoryRoutes');
const aggregatorRoutes = require('./src/routes/aggregatorRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const specialNoteRoutes = require('./src/routes/specialNoteRoutes');

const onboardingRoutes = require('./src/routes/onboardingRoutes');
const posDeviceRoutes = require('./src/routes/posDeviceRoutes');
const loyaltyRoutes = require('./src/routes/loyaltyRoutes');
const giftCardRoutes = require('./src/routes/giftCardRoutes');
const feedbackRoutes = require('./src/routes/feedbackRoutes');
const customerRoutes = require('./src/routes/customerRoutes');
const ondcRoutes = require('./src/routes/ondcRoutes');
const subscriptionRoutes = require('./src/routes/subscriptionRoutes');

// Middleware
// Explicit manual CORS
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'sec-ch-ua', 'sec-ch-ua-mobile', 'sec-ch-ua-platform']
}));
app.options('*', cors());

// Debug Logger
app.use((req, res, next) => {
    console.log(`[DEBUG] Method: ${req.method}, URL: ${req.url}, Path: ${req.path}`);
    next();
});

// Request Logger
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${new Date().toISOString()} - ${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
    });
    next();
});

app.use(express.json());
app.use('/uploads', express.static('uploads'));

const passport = require('./src/config/passport');
app.use(passport.initialize());

// Router Helper to mount on /, /api, and /server
const mount = (path, router) => {
    app.use(path, router);
    app.use(`/api${path}`, router);
    app.use(`/server${path}`, router);
};

// Routes
mount('/menu', menuRoutes);
mount('/orders', orderRoutes);
mount('/auth', authRoutes);
mount('/dashboard', dashboardRoutes);
mount('/config', configRoutes);
mount('/settings', settingRoutes);
mount('/groups', groupRoutes);
mount('/inventory', inventoryRoutes);
mount('/aggregators', aggregatorRoutes);
mount('/reports', reportRoutes);
mount('/special-notes', specialNoteRoutes);
mount('/onboarding', onboardingRoutes);
mount('/pos-devices', posDeviceRoutes);
mount('/loyalty', loyaltyRoutes);
mount('/gift-cards', giftCardRoutes);
mount('/feedback', feedbackRoutes);
mount('/customers', customerRoutes);
mount('/ondc', ondcRoutes);
mount('/subscriptions', subscriptionRoutes);
mount('/financial', require('./src/routes/financialRoutes'));
mount('/tenants', require('./src/routes/tenantRoutes'));

app.get('/', (req, res) => {
    res.json({ message: 'Aksha POS Backend API is running (Root)' });
});

app.get('/api', (req, res) => {
    res.json({ message: 'Aksha POS Backend API is running (API Root)' });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Ping route for health check (DB independent)
app.get([/\/ping$/, '/ping', '/api/ping', '/server/ping'], (req, res) => res.status(200).send('pong'));

// Catch-all for debugging
app.all('*', (req, res) => {
    console.log(`[404] Route not found: ${req.url}`);
    res.status(404).json({
        error: 'Route not found',
        url: req.url,
        path: req.path,
        method: req.method,
        note: 'This is a custom 404 from Express'
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('[Global Error]', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});



// Sync Database
let dbReady = false;
sequelize.sync().then(() => {
    console.log('Database synced');
    dbReady = true;
    if (require.main === module) {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }
}).catch(err => {
    console.error('Failed to sync database:', err);
});

// DB Readiness Middleware (optional, or just let it fail)
app.use((req, res, next) => {
    if (!dbReady && req.path !== '/ping' && req.path !== '/api/ping') {
        // We still allow it to proceed, hoping DB works or to fail naturally.
        // Adding a header to indicate status
        res.set('X-DB-Status', 'NotReady');
    } else {
        res.set('X-DB-Status', 'Ready');
    }
    next();
});

module.exports = app;
