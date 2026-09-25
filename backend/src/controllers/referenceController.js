const { Base, EquipmentType } = require('../models');

// Reference/lookup data for filter dropdowns. Admin sees all bases;
// non-admins only see their own (there's nothing useful for them to
// filter by otherwise, and it avoids leaking base names/codes org-wide).
async function listBases(req, res) {
  const where = req.user.role === 'admin' ? {} : { id: req.user.base_id };
  const bases = await Base.findAll({ where, order: [['name', 'ASC']] });
  res.json(bases);
}

async function createBase(req, res) {
  const { name, code, location } = req.body;
  if (!name || !code) return res.status(400).json({ error: 'name and code are required' });
  const base = await Base.create({ name, code, location: location || null });
  res.locals.createdId = base.id;
  res.status(201).json(base);
}

async function listEquipmentTypes(req, res) {
  const types = await EquipmentType.findAll({ order: [['category', 'ASC'], ['name', 'ASC']] });
  res.json(types);
}

async function createEquipmentType(req, res) {
  const { name, category, unit, is_serialized } = req.body;
  if (!name || !category) return res.status(400).json({ error: 'name and category are required' });
  const type = await EquipmentType.create({ name, category, unit: unit || 'unit', is_serialized: !!is_serialized });
  res.locals.createdId = type.id;
  res.status(201).json(type);
}

module.exports = { listBases, createBase, listEquipmentTypes, createEquipmentType };
