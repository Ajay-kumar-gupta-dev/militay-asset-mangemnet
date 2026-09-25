const express = require('express');
const { getSummary, getMovementDetail } = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');
const { requireRole, scopeToBase } = require('../middleware/rbac');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

// All three roles can view the dashboard; scopeToBase silently restricts
// base_commander / logistics_officer to their own base's numbers.
router.use(authenticate, requireRole(['admin', 'base_commander', 'logistics_officer']), scopeToBase);

router.get('/summary', asyncHandler(getSummary));
router.get('/movement-detail', asyncHandler(getMovementDetail)); // powers the Net Movement pop-up

module.exports = router;
