// Express 4 does not forward rejected promises from async route handlers
// to the error middleware on its own - without this, a thrown error in any
// `async (req, res) => {}` controller would hang the request instead of
// returning a clean error response.
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { asyncHandler };
