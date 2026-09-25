const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Base extends Model {}

Base.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    code: { type: DataTypes.STRING, allowNull: false, unique: true }, // e.g. "NORTH-04"
    location: { type: DataTypes.STRING, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { sequelize, modelName: 'Base', tableName: 'bases' }
);

module.exports = Base;
