const { Op } = require('sequelize');
const { Assignment, Expenditure, Base, EquipmentType, User } = require('../models');

async function listAssignments(req, res) {
  const { equipment_type_id, status, from_date, to_date, page = 1, limit = 25 } = req.query;
  const where = {};
  if (req.scopedBaseId) where.base_id = req.scopedBaseId;
  if (equipment_type_id) where.equipment_type_id = equipment_type_id;
  if (status) where.status = status;
  if (from_date || to_date) {
    where.assignment_date = {};
    if (from_date) where.assignment_date[Op.gte] = from_date;
    if (to_date) where.assignment_date[Op.lte] = to_date;
  }

  const { rows, count } = await Assignment.findAndCountAll({
    where,
    include: [
      { model: Base, attributes: ['id', 'name', 'code'] },
      { model: EquipmentType, attributes: ['id', 'name', 'category', 'unit'] },
      { model: User, as: 'assigner', attributes: ['id', 'name'] },
    ],
    order: [['assignment_date', 'DESC']],
    limit: Number(limit),
    offset: (Number(page) - 1) * Number(limit),
  });

  res.json({ data: rows, total: count, page: Number(page), limit: Number(limit) });
}

async function createAssignment(req, res) {
  const { equipment_type_id, quantity, assigned_to_name, assigned_to_service_no, assignment_date, notes, base_id } = req.body;
  if (!equipment_type_id || !quantity || !assigned_to_name || !assignment_date) {
    return res.status(400).json({ error: 'equipment_type_id, quantity, assigned_to_name and assignment_date are required' });
  }
  const resolvedBaseId = req.scopedBaseId || base_id;
  if (!resolvedBaseId) return res.status(400).json({ error: 'base_id is required' });

  const assignment = await Assignment.create({
    base_id: resolvedBaseId,
    equipment_type_id,
    quantity,
    assigned_to_name,
    assigned_to_service_no: assigned_to_service_no || null,
    assignment_date,
    assigned_by: req.user.id,
    notes: notes || null,
  });

  res.locals.createdId = assignment.id;
  res.status(201).json(assignment);
}

async function returnAssignment(req, res) {
  const assignment = await Assignment.findByPk(req.params.id);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
  if (req.scopedBaseId && assignment.base_id !== req.scopedBaseId) {
    return res.status(403).json({ error: 'Cannot modify an assignment for a different base' });
  }
  assignment.status = 'returned';
  assignment.returned_date = req.body.returned_date || new Date().toISOString().slice(0, 10);
  await assignment.save();
  res.json(assignment);
}

async function listExpenditures(req, res) {
  const { equipment_type_id, reason, from_date, to_date, page = 1, limit = 25 } = req.query;
  const where = {};
  if (req.scopedBaseId) where.base_id = req.scopedBaseId;
  if (equipment_type_id) where.equipment_type_id = equipment_type_id;
  if (reason) where.reason = reason;
  if (from_date || to_date) {
    where.expenditure_date = {};
    if (from_date) where.expenditure_date[Op.gte] = from_date;
    if (to_date) where.expenditure_date[Op.lte] = to_date;
  }

  const { rows, count } = await Expenditure.findAndCountAll({
    where,
    include: [
      { model: Base, attributes: ['id', 'name', 'code'] },
      { model: EquipmentType, attributes: ['id', 'name', 'category', 'unit'] },
      { model: User, as: 'recorder', attributes: ['id', 'name'] },
    ],
    order: [['expenditure_date', 'DESC']],
    limit: Number(limit),
    offset: (Number(page) - 1) * Number(limit),
  });

  res.json({ data: rows, total: count, page: Number(page), limit: Number(limit) });
}

async function createExpenditure(req, res) {
  const { equipment_type_id, quantity, reason, expenditure_date, notes, base_id } = req.body;
  if (!equipment_type_id || !quantity || !reason || !expenditure_date) {
    return res.status(400).json({ error: 'equipment_type_id, quantity, reason and expenditure_date are required' });
  }
  const resolvedBaseId = req.scopedBaseId || base_id;
  if (!resolvedBaseId) return res.status(400).json({ error: 'base_id is required' });

  const expenditure = await Expenditure.create({
    base_id: resolvedBaseId,
    equipment_type_id,
    quantity,
    reason,
    expenditure_date,
    recorded_by: req.user.id,
    notes: notes || null,
  });

  res.locals.createdId = expenditure.id;
  res.status(201).json(expenditure);
}

module.exports = { listAssignments, createAssignment, returnAssignment, listExpenditures, createExpenditure };
