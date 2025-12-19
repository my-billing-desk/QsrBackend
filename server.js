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

// Router Helper to mount on both / and /api
const mount = (path, router) => {
    app.use(path, router);
    app.use(`/api${path}`, router);
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

app.get('/', (req, res) => {
    res.json({ message: 'QSR Backend API is running (Root)' });
});

app.get('/api', (req, res) => {
    res.json({ message: 'QSR Backend API is running (API Root)' });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

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

// Sync Database and Start Server
// force: false ensures we don't drop tables on restart
// Sync Database
sequelize.sync().then(() => {
    console.log('Database synced');
    if (require.main === module) {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }
}).catch(err => {
    console.error('Failed to sync database:', err);
});

module.exports = app;
