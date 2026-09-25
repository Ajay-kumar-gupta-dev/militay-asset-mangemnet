const express = require('express');
const { list, create } = require('../controllers/purchaseController');
const { authenticate } = require('../middleware/auth');
const { requireRole, scopeToBase } = require('../middleware/rbac');
const { auditLog } = require('../middleware/auditLogger');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate, scopeToBase);

// All three roles may view purchase history for their scope.
router.get('/', requireRole(['admin', 'base_commander', 'logistics_officer']), asyncHandler(list));

// Recording a purchase: admin, base commander (own base), logistics officer (own base).
router.post(
  '/',
  requireRole(['admin', 'base_commander', 'logistics_officer']),
  auditLog('CREATE_PURCHASE', 'Purchase'),
  asyncHandler(create)
);

module.exports = router;
