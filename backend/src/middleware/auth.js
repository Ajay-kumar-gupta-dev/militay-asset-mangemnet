const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Verifies the JWT and attaches the authenticated user (id, role, base_id)
// to req.user. Every route below this in the chain can trust req.user.
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Missing or malformed Authorization header' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(payload.sub);

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid or deactivated account' });
    }

    req.user = { id: user.id, role: user.role, base_id: user.base_id, name: user.name };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { authenticate };
