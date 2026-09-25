const { AuditLog } = require('../models');

const SENSITIVE_KEYS = ['password', 'password_hash', 'token'];

function sanitize(body) {
  if (!body || typeof body !== 'object') return null;
  const clean = { ...body };
  for (const key of SENSITIVE_KEYS) delete clean[key];
  return clean;
}

// Attach to any route whose action should be auditable (all POST/PUT/PATCH/
// DELETE routes for purchases, transfers, assignments, expenditures, users).
// Logs AFTER the response is sent so it never adds latency or fails the
// underlying request; a logging failure is reported to stderr, not thrown.
function auditLog(action, entityType) {
  return (req, res, next) => {
    res.on('finish', () => {
      AuditLog.create({
        user_id: req.user ? req.user.id : null,
        action,
        method: req.method,
        endpoint: req.originalUrl,
        entity_type: entityType,
        entity_id: req.params.id || (res.locals.createdId ?? null),
        status_code: res.statusCode,
        ip_address: req.ip,
        request_body: sanitize(req.body),
      }).catch((err) => console.error('[audit-log] failed to persist entry:', err.message));
    });
    next();
  };
}

module.exports = { auditLog };
