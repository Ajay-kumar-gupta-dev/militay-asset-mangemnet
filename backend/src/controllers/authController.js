const jwt = require('jsonwebtoken');
const { User, Base } = require('../models');

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = await User.findOne({ where: { email }, include: [Base] });
  if (!user || !user.is_active || !(await user.validatePassword(password))) {
    // Deliberately generic message - don't reveal which field was wrong.
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { sub: user.id, role: user.role, base_id: user.base_id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      base: user.Base ? { id: user.Base.id, name: user.Base.name } : null,
    },
  });
}

async function me(req, res) {
  const user = await User.findByPk(req.user.id, { include: [Base] });
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    base: user.Base ? { id: user.Base.id, name: user.Base.name } : null,
  });
}

module.exports = { login, me };
