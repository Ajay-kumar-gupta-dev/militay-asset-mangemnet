const express = require('express');
const { list, create } = require('../controllers/transferController');
const { authenticate } = require('../middleware/auth');
const { requireRole, scopeToBase } = require('../middleware/rbac');
const { auditLog } = require('../middleware/auditLogger');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate, scopeToBase);

router.get('/', requireRole(['admin', 'base_commander', 'logistics_officer']), asyncHandler(list));

router.post(
  '/',
  requireRole(['admin', 'base_commander', 'logistics_officer']),
  auditLog('CREATE_TRANSFER', 'Transfer'),
  asyncHandler(create)
);

module.exports = router;
