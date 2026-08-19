const express = require('express');
const cors = require('cors');
const clientRoutes = require('./routes/clientRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const reportRoutes = require('./routes/reportRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const alertRoutes = require('./routes/alertRoutes');
const caisseRoutes = require('./routes/caisseRoutes');
const eventRoutes = require('./routes/eventRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const sinistreRoutes = require('./routes/sinistreRoutes');
const importRoutes = require('./routes/importRoutes');
const errorHandler = require('./middlewares/errorHandler');
const Caisse = require('./models/caisseModel');
const ClientHistory = require('./models/clientHistoryModel');
const path = require('path');

const app = express();

// Middlewares
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://100.113.217.68:5173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));
app.use(express.json());

// Initialize caisse tables
Caisse.initTables().catch(err => console.error('❌ Caisse tables init failed:', err.message));
ClientHistory.initTable().catch(err => console.error('❌ ClientHistory table init failed:', err.message));

// Serve static files from uploads folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/caisse', caisseRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/sinistres', sinistreRoutes);
app.use('/api/clients/import', importRoutes);

// 404 Route
app.use((req, res, next) => {
  const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  err.status = 'fail';
  err.statusCode = 404;
  next(err);
});

// Error handling
app.use(errorHandler);

module.exports = app;
