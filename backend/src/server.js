require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // In a real deployment, use `sequelize-cli` migrations instead of
    // sync(). Left here so the scaffold runs out of the box in dev.
    if (process.env.NODE_ENV !== 'production') {
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
