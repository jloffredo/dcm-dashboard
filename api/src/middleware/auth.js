// The real DCM API authenticates with an `api-key` header (Postman collection
// uses an apikey auth type bound to {{token}}). For local frontend development
// we don't want to block on a real key, so we accept any non-empty value and
// just echo back a fake authenticated user context.
function apiKeyAuth(req, res, next) {
  const key = req.header('api-key');
  if (!key) {
    return res.status(401).json({ error: 'Missing api-key header' });
  }
  req.apiKey = key;
  next();
}

module.exports = { apiKeyAuth };
