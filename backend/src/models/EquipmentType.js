const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class EquipmentType extends Model {}

EquipmentType.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true }, // e.g. "5.56mm Rifle"
    category: {
      type: DataTypes.ENUM('vehicle', 'weapon', 'ammunition'),
      allowNull: false,
    },
    unit: { type: DataTypes.STRING, allowNull: false, defaultValue: 'unit' }, // "rounds", "units"
    is_serialized: { type: DataTypes.BOOLEAN, defaultValue: false }, // true for vehicles/weapons tracked by serial
  },
  { sequelize, modelName: 'EquipmentType', tableName: 'equipment_types' }
);

module.exports = EquipmentType;
