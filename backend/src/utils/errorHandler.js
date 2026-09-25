// Catches anything thrown/rejected in a route (including Sequelize
// validation errors) so the client always gets clean JSON, and stack
// traces never leak into a production response.
function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({ error: err.errors.map((e) => e.message).join('; ') });
  }

  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' && status === 500 ? 'Internal server error' : err.message;
  res.status(status).json({ error: message });
}

module.exports = { errorHandler };
