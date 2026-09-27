const { Sequelize } = require('sequelize');
require('dotenv').config();

// PostgreSQL chosen for ACID-compliant transactional integrity: asset
// balances must never be lost or double-counted mid-transfer, and the
// domain is inherently relational (bases <-> equipment types <-> movements).
// See README.md "Database Design" for the full justification.
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      underscored: true,
      timestamps: true,
    },
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    // Hosted Postgres providers (Neon, Render, Railway, etc.) require SSL
    // and use certificates not in Node's default trust store. Local dev
    // Postgres has no SSL configured at all, so this only activates when
    // DB_SSL=true is explicitly set (e.g. in production env vars).
    dialectOptions:
      process.env.DB_SSL === 'true'
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {},
  }
);

module.exports = sequelize;
