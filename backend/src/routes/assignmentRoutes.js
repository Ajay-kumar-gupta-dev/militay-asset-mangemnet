const express = require('express');
const {
  listAssignments,
  createAssignment,
  returnAssignment,
  listExpenditures,
  createExpenditure,
} = require('../controllers/assignmentController');
const { authenticate } = require('../middleware/auth');
const { requireRole, scopeToBase } = require('../middleware/rbac');
const { auditLog } = require('../middleware/auditLogger');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate, scopeToBase);

// Assignments & expenditures are NOT in logistics_officer's remit per the
// spec ("limited access to purchases and transfers") - admin and base
// commander only.
const canManage = requireRole(['admin', 'base_commander']);

router.get('/assignments', canManage, asyncHandler(listAssignments));
router.post('/assignments', canManage, auditLog('CREATE_ASSIGNMENT', 'Assignment'), asyncHandler(createAssignment));
router.patch(
  '/assignments/:id/return',
  canManage,
  auditLog('RETURN_ASSIGNMENT', 'Assignment'),
  asyncHandler(returnAssignment)
);

router.get('/expenditures', canManage, asyncHandler(listExpenditures));
router.post(
  '/expenditures',
  canManage,
  auditLog('CREATE_EXPENDITURE', 'Expenditure'),
  asyncHandler(createExpenditure)
);

module.exports = router;
