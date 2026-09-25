const sequelize = require('../config/database');
const User = require('./User');
const Base = require('./Base');
const EquipmentType = require('./EquipmentType');
const Purchase = require('./Purchase');
const Transfer = require('./Transfer');
const Assignment = require('./Assignment');
const Expenditure = require('./Expenditure');
const AuditLog = require('./AuditLog');

// --- User <-> Base ---
Base.hasMany(User, { foreignKey: 'base_id' });
User.belongsTo(Base, { foreignKey: 'base_id' });

// --- Purchase ---
Base.hasMany(Purchase, { foreignKey: 'base_id' });
Purchase.belongsTo(Base, { foreignKey: 'base_id' });
EquipmentType.hasMany(Purchase, { foreignKey: 'equipment_type_id' });
Purchase.belongsTo(EquipmentType, { foreignKey: 'equipment_type_id' });
User.hasMany(Purchase, { foreignKey: 'recorded_by' });
Purchase.belongsTo(User, { foreignKey: 'recorded_by', as: 'recorder' });

// --- Transfer ---
Base.hasMany(Transfer, { foreignKey: 'from_base_id', as: 'transfersOut' });
Base.hasMany(Transfer, { foreignKey: 'to_base_id', as: 'transfersIn' });
Transfer.belongsTo(Base, { foreignKey: 'from_base_id', as: 'fromBase' });
Transfer.belongsTo(Base, { foreignKey: 'to_base_id', as: 'toBase' });
EquipmentType.hasMany(Transfer, { foreignKey: 'equipment_type_id' });
Transfer.belongsTo(EquipmentType, { foreignKey: 'equipment_type_id' });
User.hasMany(Transfer, { foreignKey: 'initiated_by' });
Transfer.belongsTo(User, { foreignKey: 'initiated_by', as: 'initiator' });

// --- Assignment ---
Base.hasMany(Assignment, { foreignKey: 'base_id' });
Assignment.belongsTo(Base, { foreignKey: 'base_id' });
EquipmentType.hasMany(Assignment, { foreignKey: 'equipment_type_id' });
Assignment.belongsTo(EquipmentType, { foreignKey: 'equipment_type_id' });
User.hasMany(Assignment, { foreignKey: 'assigned_by' });
Assignment.belongsTo(User, { foreignKey: 'assigned_by', as: 'assigner' });

// --- Expenditure ---
Base.hasMany(Expenditure, { foreignKey: 'base_id' });
Expenditure.belongsTo(Base, { foreignKey: 'base_id' });
EquipmentType.hasMany(Expenditure, { foreignKey: 'equipment_type_id' });
Expenditure.belongsTo(EquipmentType, { foreignKey: 'equipment_type_id' });
User.hasMany(Expenditure, { foreignKey: 'recorded_by' });
Expenditure.belongsTo(User, { foreignKey: 'recorded_by', as: 'recorder' });

// --- AuditLog ---
User.hasMany(AuditLog, { foreignKey: 'user_id' });
AuditLog.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  sequelize,
  User,
  Base,
  EquipmentType,
  Purchase,
  Transfer,
  Assignment,
  Expenditure,
  AuditLog,
};
