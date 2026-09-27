require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // In a real long-lived deployment, use `sequelize-cli` migrations
    // instead of sync(). For this framework stage there are no migrations
    // yet, so sync runs whenever DB_SYNC=true (defaults to true) - this
    // includes first deploys to a fresh host like Render, which otherwise
    // would connect successfully but have no tables at all.
    if (process.env.DB_SYNC !== 'false') {
      await sequelize.sync();
      console.log('Models synced.');
    }

    app.listen(PORT, () => console.log(`MAMS API listening on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
