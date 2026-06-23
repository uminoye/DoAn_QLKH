require('dotenv').config();
const app = require('./app');
const config = require('./config');
const sequelize = require('./config/database');

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('[DB] PostgreSQL connected successfully');
    console.log(`[ENV] Running in ${config.nodeEnv} mode`);

    app.listen(config.port, () => {
      console.log(`[SERVER] WMS API running on http://localhost:${config.port}`);
      console.log(`[ENV] CORS origin: ${config.corsOrigin}`);
    });
  } catch (err) {
    console.error('[SERVER] Failed to start:', err.message);
    process.exit(1);
  }
};

startServer();
