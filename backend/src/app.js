const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: config.nodeEnv });
});

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/warehouses', require('./routes/warehouse.routes'));
app.use('/api/categories', require('./routes/category.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/customers', require('./routes/customer.routes'));
app.use('/api/locations', require('./routes/location.routes'));
app.use('/api/inventory', require('./routes/inventory.routes'));
app.use('/api/inbound', require('./routes/inbound.routes'));
app.use('/api/outbound', require('./routes/outbound.routes'));
app.use('/api/sales', require('./routes/sales.routes'));
app.use('/api/reports', require('./routes/report.routes'));

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use(errorHandler);

module.exports = app;
