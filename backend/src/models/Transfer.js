const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Transfer extends Model {}

Transfer.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    from_base_id: { type: DataTypes.UUID, allowNull: false },
    to_base_id: { type: DataTypes.UUID, allowNull: false },
    equipment_type_id: { type: DataTypes.UUID, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
    transfer_date: { type: DataTypes.DATEONLY, allowNull: false },
    status: {
      // Transfers are logged as completed by default for this MVP; the
      // enum leaves room to add an approval workflow later without a
      // schema change.
      type: DataTypes.ENUM('pending', 'in_transit', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'completed',
    },
    initiated_by: { type: DataTypes.UUID, allowNull: false }, // User.id
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    modelName: 'Transfer',
    tableName: 'transfers',
    validate: {
      basesDiffer() {
        if (this.from_base_id === this.to_base_id) {
          throw new Error('from_base_id and to_base_id must differ');
        }
      },
    },
  }
);

module.exports = Transfer;
