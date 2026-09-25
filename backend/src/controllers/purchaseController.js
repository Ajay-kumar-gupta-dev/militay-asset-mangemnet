const { Op } = require('sequelize');
const { Purchase, Base, EquipmentType, User } = require('../models');

async function list(req, res) {
  const { equipment_type_id, from_date, to_date, page = 1, limit = 25 } = req.query;
  const where = {};
  if (req.scopedBaseId) where.base_id = req.scopedBaseId;
  if (equipment_type_id) where.equipment_type_id = equipment_type_id;
  if (from_date || to_date) {
    where.purchase_date = {};
    if (from_date) where.purchase_date[Op.gte] = from_date;
    if (to_date) where.purchase_date[Op.lte] = to_date;
  }

  const { rows, count } = await Purchase.findAndCountAll({
    where,
    include: [
      { model: Base, attributes: ['id', 'name', 'code'] },
      { model: EquipmentType, attributes: ['id', 'name', 'category', 'unit'] },
      { model: User, as: 'recorder', attributes: ['id', 'name'] },
    ],
    order: [['purchase_date', 'DESC']],
    limit: Number(limit),
    offset: (Number(page) - 1) * Number(limit),
  });

  res.json({ data: rows, total: count, page: Number(page), limit: Number(limit) });
}

async function create(req, res) {
  const { base_id, equipment_type_id, quantity, unit_cost, vendor, purchase_date, reference_no, notes } = req.body;

  if (!equipment_type_id || !quantity || !purchase_date) {
    return res.status(400).json({ error: 'equipment_type_id, quantity and purchase_date are required' });
  }

  const resolvedBaseId = req.scopedBaseId || base_id;
  if (!resolvedBaseId) return res.status(400).json({ error: 'base_id is required' });

  const purchase = await Purchase.create({
    base_id: resolvedBaseId,
    equipment_type_id,
    quantity,
    unit_cost: unit_cost || null,
    vendor: vendor || null,
    purchase_date,
    reference_no: reference_no || null,
    recorded_by: req.user.id,
    notes: notes || null,
  });

  res.locals.createdId = purchase.id;
  res.status(201).json(purchase);
}

module.exports = { list, create };
