/**
 * RBAC middleware. Two layers:
 *   1. requireRole([...])   - coarse: is this role even allowed on this route?
 *   2. scopeToBase          - fine: for non-admins, silently pin every
 *                             query/write to their own base, regardless of
 *                             what base_id the client sent.
 *
 * Roles:
 *   admin              - full access, all bases, all operations
 *   base_commander     - full read/write, but only for their own base
 *   logistics_officer  - read/write on purchases & transfers only,
 *                        only for their own base (no assignments/expenditures,
 *                        no user management)
 */

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions for this action' });
    }
    next();
  };
}

// Applied after requireRole on routes that are base-scoped. Admin passes
// through untouched (base_id filter stays whatever they asked for, or
// none = all bases). Everyone else gets req.scopedBaseId forced to their
// own base — controllers MUST use req.scopedBaseId, never trust
// req.query.base_id / req.body.base_id directly, for non-admins.
function scopeToBase(req, res, next) {
  if (req.user.role === 'admin') {
    req.scopedBaseId = req.query.base_id || req.body.base_id || null;
    return next();
  }

  if (!req.user.base_id) {
    return res.status(403).json({ error: 'Account has no assigned base' });
  }

  req.scopedBaseId = req.user.base_id;

  // Prevent a non-admin from writing a transfer/purchase/etc. against a
  // different base by forging the request body.
  if (req.body && req.body.base_id && req.body.base_id !== req.user.base_id) {
    return res.status(403).json({ error: 'Cannot operate on a different base' });
  }
  // Transfers also carry from_base_id - a base commander may only
  // initiate transfers FROM their own base.
  if (req.body && req.body.from_base_id && req.body.from_base_id !== req.user.base_id) {
    return res.status(403).json({ error: 'Can only transfer assets out of your own base' });
  }

  next();
}

module.exports = { requireRole, scopeToBase };
