const express = require('express');
const store = require('../data/store');
const { listResponse, findById, notFound } = require('../utils/helpers');

const router = express.Router();

router.get('/asset/:id', (req, res) => {
  const found = findById(store.assets, req.params.id);
  if (!found) return notFound(res, 'Asset');
  res.json(found);
});

router.get('/asset', (req, res) => {
  res.json(listResponse(store.assets, req));
});

router.get('/grant/:id', (req, res) => {
  const found = findById(store.grants, req.params.id);
  if (!found) return notFound(res, 'Grant');
  res.json(found);
});

router.get('/grant', (req, res) => {
  res.json(listResponse(store.grants, req));
});

module.exports = router;
