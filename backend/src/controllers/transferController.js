const { Op } = require('sequelize');
const { Transfer, Base, EquipmentType, User, sequelize } = require('../models');

async function list(req, res) {
  const { equipment_type_id, from_date, to_date, direction, page = 1, limit = 25 } = req.query;
  const where = {};

  if (req.scopedBaseId) {
    // Show transfers touching this base, either direction, unless the
    // client asked to narrow to just "in" or just "out".
    if (direction === 'in') where.to_base_id = req.scopedBaseId;
    else if (direction === 'out') where.from_base_id = req.scopedBaseId;
    else where[Op.or] = [{ from_base_id: req.scopedBaseId }, { to_base_id: req.scopedBaseId }];
  }

  if (equipment_type_id) where.equipment_type_id = equipment_type_id;
  if (from_date || to_date) {
    where.transfer_date = {};
    if (from_date) where.transfer_date[Op.gte] = from_date;
    if (to_date) where.transfer_date[Op.lte] = to_date;
  }

  const { rows, count } = await Transfer.findAndCountAll({
    where,
    include: [
      { model: Base, as: 'fromBase', attributes: ['id', 'name', 'code'] },
      { model: Base, as: 'toBase', attributes: ['id', 'name', 'code'] },
      { model: EquipmentType, attributes: ['id', 'name', 'category', 'unit'] },
      { model: User, as: 'initiator', attributes: ['id', 'name'] },
    ],
    order: [['transfer_date', 'DESC']],
    limit: Number(limit),
    offset: (Number(page) - 1) * Number(limit),
  });

  res.json({ data: rows, total: count, page: Number(page), limit: Number(limit) });
}

async function create(req, res) {
  const { from_base_id, to_base_id, equipment_type_id, quantity, transfer_date, notes } = req.body;

  if (!to_base_id || !equipment_type_id || !quantity || !transfer_date) {
    return res.status(400).json({ error: 'to_base_id, equipment_type_id, quantity and transfer_date are required' });
  }

  const resolvedFromBaseId = req.scopedBaseId || from_base_id;
  if (!resolvedFromBaseId) return res.status(400).json({ error: 'from_base_id is required' });
  if (resolvedFromBaseId === to_base_id) {
    return res.status(400).json({ error: 'from_base_id and to_base_id must differ' });
  }

  // Wrapped in a transaction: this is exactly the kind of "must never
  // half-apply" write PostgreSQL's ACID guarantees exist for.
  const transfer = await sequelize.transaction(async (t) => {
    return Transfer.create(
      {
        from_base_id: resolvedFromBaseId,
        to_base_id,
        equipment_type_id,
        quantity,
        transfer_date,
        status: 'completed',
        initiated_by: req.user.id,
        notes: notes || null,
      },
      { transaction: t }
    );
  });

  res.locals.createdId = transfer.id;
  res.status(201).json(transfer);
}

module.exports = { list, create };
