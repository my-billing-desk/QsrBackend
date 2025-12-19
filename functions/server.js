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
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'sec-ch-ua', 'sec-ch-ua-mobile', 'sec-ch-ua-platform']
}));

// Debug Logger
app.use((req, res, next) => {
    console.log(`[DEBUG] Method: ${req.method}, URL: ${req.url}, OriginalUrl: ${req.originalUrl}`);
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

// Routes
// In Cloud Functions, req.url might be stripped of '/api' or not. 
// We mount on /api/menu to match specific subpaths.
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/config', configRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/aggregators', aggregatorRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/special-notes', specialNoteRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'QSR Backend API is running (Root)' });
});

app.get('/api', (req, res) => {
    res.json({ message: 'QSR Backend API is running (API Root)' });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
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
