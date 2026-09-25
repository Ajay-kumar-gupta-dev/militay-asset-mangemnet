const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

// Purchases are append-only ledger rows. Balances are DERIVED from the
// ledger (purchases + transfers - assignments - expenditures), never
// stored as a mutable running total, so history and totals can never
// drift out of sync. See README.md "Balance Calculation".
class Purchase extends Model {}

Purchase.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    base_id: { type: DataTypes.UUID, allowNull: false },
    equipment_type_id: { type: DataTypes.UUID, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
    unit_cost: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    vendor: { type: DataTypes.STRING, allowNull: true },
    purchase_date: { type: DataTypes.DATEONLY, allowNull: false },
    reference_no: { type: DataTypes.STRING, allowNull: true },
    recorded_by: { type: DataTypes.UUID, allowNull: false }, // User.id
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  { sequelize, modelName: 'Purchase', tableName: 'purchases' }
);

module.exports = Purchase;
