const express = require('express');
const store = require('../data/store');
const { listResponse } = require('../utils/helpers');

const router = express.Router();

router.get('/log', (req, res) => {
  let items = store.logs;
  if (req.query.method) items = items.filter((l) => l.method === req.query.method);
  if (req.query.url) items = items.filter((l) => l.url.includes(req.query.url));
  if (req.query['user-id']) items = items.filter((l) => String(l.userId) === req.query['user-id']);
  res.json(listResponse(items, req));
});

module.exports = router;
