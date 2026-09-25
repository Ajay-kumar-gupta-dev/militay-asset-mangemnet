const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

// Immutable record of every write. Never updated or deleted by app code —
// only ever inserted into. This is what makes the "accountability"
// requirement auditable rather than just aspirational.
class AuditLog extends Model {}

AuditLog.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID, allowNull: true }, // null for failed/anonymous auth attempts
    action: { type: DataTypes.STRING, allowNull: false }, // e.g. "CREATE_TRANSFER"
    method: { type: DataTypes.STRING, allowNull: false }, // HTTP method
    endpoint: { type: DataTypes.STRING, allowNull: false },
    entity_type: { type: DataTypes.STRING, allowNull: true }, // "Transfer", "Purchase", ...
    entity_id: { type: DataTypes.UUID, allowNull: true },
    status_code: { type: DataTypes.INTEGER, allowNull: false },
    ip_address: { type: DataTypes.STRING, allowNull: true },
    request_body: { type: DataTypes.JSONB, allowNull: true }, // sanitized (no passwords/tokens)
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  { sequelize, modelName: 'AuditLog', tableName: 'audit_logs', updatedAt: false }
);

module.exports = AuditLog;
