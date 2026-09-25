const express = require('express');
const {
  listBases,
  createBase,
  listEquipmentTypes,
  createEquipmentType,
} = require('../controllers/referenceController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { auditLog } = require('../middleware/auditLogger');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);

router.get('/bases', asyncHandler(listBases));
router.post('/bases', requireRole(['admin']), auditLog('CREATE_BASE', 'Base'), asyncHandler(createBase));

router.get('/equipment-types', asyncHandler(listEquipmentTypes));
router.post(
  '/equipment-types',
  requireRole(['admin']),
  auditLog('CREATE_EQUIPMENT_TYPE', 'EquipmentType'),
  asyncHandler(createEquipmentType)
);

module.exports = router;
