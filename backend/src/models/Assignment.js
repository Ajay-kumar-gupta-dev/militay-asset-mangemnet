const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

// An asset "assigned" to personnel. Kept separate from Expenditure because
// an assignment is reversible (personnel can be reassigned / equipment
// returned) whereas expenditure is a permanent reduction (ammo fired, etc.)
class Assignment extends Model {}

Assignment.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    base_id: { type: DataTypes.UUID, allowNull: false },
    equipment_type_id: { type: DataTypes.UUID, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
    assigned_to_name: { type: DataTypes.STRING, allowNull: false },
    assigned_to_service_no: { type: DataTypes.STRING, allowNull: true },
    assignment_date: { type: DataTypes.DATEONLY, allowNull: false },
    returned_date: { type: DataTypes.DATEONLY, allowNull: true },
    status: {
      type: DataTypes.ENUM('active', 'returned'),
      allowNull: false,
      defaultValue: 'active',
    },
    assigned_by: { type: DataTypes.UUID, allowNull: false }, // User.id
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  { sequelize, modelName: 'Assignment', tableName: 'assignments' }
);

module.exports = Assignment;
