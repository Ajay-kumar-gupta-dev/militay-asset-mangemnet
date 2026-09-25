const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

// A permanent reduction in stock: ammunition fired, equipment destroyed
// or decommissioned. Unlike Assignment, there is no return path.
class Expenditure extends Model {}

Expenditure.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    base_id: { type: DataTypes.UUID, allowNull: false },
    equipment_type_id: { type: DataTypes.UUID, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
    reason: {
      type: DataTypes.ENUM('training', 'operation', 'decommissioned', 'lost', 'other'),
      allowNull: false,
    },
    expenditure_date: { type: DataTypes.DATEONLY, allowNull: false },
    recorded_by: { type: DataTypes.UUID, allowNull: false }, // User.id
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  { sequelize, modelName: 'Expenditure', tableName: 'expenditures' }
);

module.exports = Expenditure;
