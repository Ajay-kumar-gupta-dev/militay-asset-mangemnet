const { Op, fn, col } = require('sequelize');
const { Purchase, Transfer, Assignment, Expenditure } = require('../models');

/**
 * Balance model (see README.md "Balance Calculation" for the full writeup):
 *
 *   ClosingBalance(period) = OpeningBalance(period)
 *                             + Purchases + TransferIn - TransferOut   [= Net Movement]
 *                             - Assigned - Expended
 *
 *   OpeningBalance(period) = ClosingBalance as of the instant before
 *                             start_date, i.e. the same formula evaluated
 *                             over all activity from time zero up to (not
 *                             including) start_date.
 *
 * Nothing here is a stored running total - every figure is summed from the
 * ledger tables at request time, scoped by base/equipment/date. This keeps
 * the numbers always consistent with the underlying transaction history.
 */

function baseWhere(scopedBaseId, extra = {}) {
  const where = { ...extra };
  if (scopedBaseId) where.base_id = scopedBaseId;
  return where;
}

async function sumQuantity(Model, where) {
  const result = await Model.findOne({ attributes: [[fn('COALESCE', fn('SUM', col('quantity')), 0), 'total']], where, raw: true });
  return Number(result.total);
}

async function computeMovement({ baseId, equipmentTypeId, fromDate, toDate }) {
  const dateRange = {};
  if (fromDate) dateRange[Op.gte] = fromDate;
  if (toDate) dateRange[Op.lte] = toDate;

  const equipmentFilter = equipmentTypeId ? { equipment_type_id: equipmentTypeId } : {};
  const dateFilter = Object.keys(dateRange).length ? { purchase_date: dateRange } : {};

  const purchases = await sumQuantity(Purchase, baseWhere(baseId, { ...equipmentFilter, ...(fromDate || toDate ? { purchase_date: dateRange } : {}) }));

  const transferDateFilter = fromDate || toDate ? { transfer_date: dateRange } : {};
  const transferIn = await sumQuantity(Transfer, {
    to_base_id: baseId || { [Op.ne]: null },
    status: 'completed',
    ...equipmentFilter,
    ...transferDateFilter,
  });
  const transferOut = await sumQuantity(Transfer, {
    from_base_id: baseId || { [Op.ne]: null },
    status: 'completed',
    ...equipmentFilter,
    ...transferDateFilter,
  });

  const assignmentDateFilter = fromDate || toDate ? { assignment_date: dateRange } : {};
  const assigned = await sumQuantity(Assignment, baseWhere(baseId, { ...equipmentFilter, ...assignmentDateFilter }));

  const expenditureDateFilter = fromDate || toDate ? { expenditure_date: dateRange } : {};
  const expended = await sumQuantity(Expenditure, baseWhere(baseId, { ...equipmentFilter, ...expenditureDateFilter }));

  const netMovement = purchases + transferIn - transferOut;

  return { purchases, transferIn, transferOut, netMovement, assigned, expended };
}

async function getSummary(req, res) {
  const { equipment_type_id, from_date, to_date } = req.query;
  const baseId = req.scopedBaseId || null;

  // Opening balance = everything that happened strictly before from_date.
  // With no from_date given, the "period" is all of history, so there is
  // nothing before it to open with.
  const openingBalance = from_date
    ? (await computeMovementBefore({ baseId, equipmentTypeId: equipment_type_id, beforeDate: from_date })).closingBalance
    : 0;

  const periodMovement = await computeMovement({
    baseId,
    equipmentTypeId: equipment_type_id,
    fromDate: from_date || null,
    toDate: to_date || null,
  });

  const closingBalance =
    openingBalance + periodMovement.netMovement - periodMovement.assigned - periodMovement.expended;

  res.json({
    filters: { base_id: baseId, equipment_type_id: equipment_type_id || null, from_date: from_date || null, to_date: to_date || null },
    openingBalance,
    closingBalance,
    netMovement: periodMovement.netMovement,
    purchases: periodMovement.purchases,
    transferIn: periodMovement.transferIn,
    transferOut: periodMovement.transferOut,
    assigned: periodMovement.assigned,
    expended: periodMovement.expended,
  });
}

// Balance accumulated over all history strictly before `beforeDate`.
async function computeMovementBefore({ baseId, equipmentTypeId, beforeDate }) {
  const m = await computeMovement({ baseId, equipmentTypeId, fromDate: null, toDate: null });
  // Re-run each sum with an explicit "< beforeDate" filter instead of the
  // open-ended one computeMovement used above.
  const equipmentFilter = equipmentTypeId ? { equipment_type_id: equipmentTypeId } : {};

  const purchases = await sumQuantity(Purchase, baseWhere(baseId, { ...equipmentFilter, purchase_date: { [Op.lt]: beforeDate } }));
  const transferIn = await sumQuantity(Transfer, { to_base_id: baseId || { [Op.ne]: null }, status: 'completed', ...equipmentFilter, transfer_date: { [Op.lt]: beforeDate } });
  const transferOut = await sumQuantity(Transfer, { from_base_id: baseId || { [Op.ne]: null }, status: 'completed', ...equipmentFilter, transfer_date: { [Op.lt]: beforeDate } });
  const assigned = await sumQuantity(Assignment, baseWhere(baseId, { ...equipmentFilter, assignment_date: { [Op.lt]: beforeDate } }));
  const expended = await sumQuantity(Expenditure, baseWhere(baseId, { ...equipmentFilter, expenditure_date: { [Op.lt]: beforeDate } }));

  const closingBalance = purchases + transferIn - transferOut - assigned - expended;
  return { closingBalance };
}

// Drill-down for the "Net Movement" pop-up: itemised purchases, transfers
// in, and transfers out for the same filter set as the summary card.
async function getMovementDetail(req, res) {
  const { equipment_type_id, from_date, to_date } = req.query;
  const baseId = req.scopedBaseId || null;
  const dateRange = {};
  if (from_date) dateRange[Op.gte] = from_date;
  if (to_date) dateRange[Op.lte] = to_date;
  const equipmentFilter = equipment_type_id ? { equipment_type_id: equipment_type_id } : {};
  const hasDateFilter = from_date || to_date;

  const purchases = await Purchase.findAll({
    where: baseWhere(baseId, { ...equipmentFilter, ...(hasDateFilter ? { purchase_date: dateRange } : {}) }),
    order: [['purchase_date', 'DESC']],
  });

  const transfersIn = await Transfer.findAll({
    where: { to_base_id: baseId || { [Op.ne]: null }, status: 'completed', ...equipmentFilter, ...(hasDateFilter ? { transfer_date: dateRange } : {}) },
    order: [['transfer_date', 'DESC']],
  });

  const transfersOut = await Transfer.findAll({
    where: { from_base_id: baseId || { [Op.ne]: null }, status: 'completed', ...equipmentFilter, ...(hasDateFilter ? { transfer_date: dateRange } : {}) },
    order: [['transfer_date', 'DESC']],
  });

  res.json({ purchases, transfersIn, transfersOut });
}

module.exports = { getSummary, getMovementDetail };
