const express = require('express');
const store = require('../data/store');
const lookups = require('../data/lookups');
const { listResponse, nextId, findById, notFound } = require('../utils/helpers');

const router = express.Router();

router.get('/agency/state', (req, res) => {
  res.json(listResponse(lookups.usStates, req));
});

router.get('/agency/:id', (req, res) => {
  const found = findById(store.agencies, req.params.id);
  if (!found) return notFound(res, 'Agency');
  res.json(found);
});

router.put('/agency/:id', (req, res) => {
  const found = findById(store.agencies, req.params.id);
  if (!found) return notFound(res, 'Agency');
  Object.assign(found, req.body, { id: found.id });
  res.json(found);
});

// operationId: disableAgency — the real endpoint soft-disables rather than deleting.
router.delete('/agency/:id', (req, res) => {
  const found = findById(store.agencies, req.params.id);
  if (!found) return notFound(res, 'Agency');
  found.is_enabled = false;
  res.json(found);
});

router.get('/agency', (req, res) => {
  res.json(listResponse(store.agencies, req));
});

router.post('/agency', (req, res) => {
  const agency = {
    id: nextId(store.agencies),
    title: '',
    category: '',
    is_default: false,
    is_enabled: true,
    created_at: new Date().toISOString(),
    ...req.body
  };
  store.agencies.push(agency);
  res.status(201).json(agency);
});

module.exports = router;
