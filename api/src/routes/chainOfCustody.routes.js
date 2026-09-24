const express = require('express');
const store = require('../data/store');
const lookups = require('../data/lookups');
const dynamicFields = require('../data/dynamicFields');
const { listResponse, nextId, findById, notFound } = require('../utils/helpers');
const { buildFieldsBag, applyFieldOverrides, formDescriptor } = require('../utils/dynamicFields');

const router = express.Router();

const cocGroupByType = {
  intake: dynamicFields.cocIntake,
  exchange: dynamicFields.cocExchange,
  disposal: dynamicFields.cocDisposal
};

// --- Intake ---
router.get('/chain-of-custody/intake/reason', (req, res) => {
  res.json(listResponse(lookups.intakeReasons, req));
});
router.get('/chain-of-custody/intake/type', (req, res) => {
  res.json(listResponse(lookups.intakeTypes, req));
});
router.get('/chain-of-custody/intake/form', (req, res) => {
  res.json(formDescriptor(dynamicFields.cocIntake.fields, req.query['only-required']));
});

// --- Exchange ---
router.get('/chain-of-custody/exchange/reason', (req, res) => {
  res.json(listResponse(lookups.exchangeReasons, req));
});
router.get('/chain-of-custody/exchange/type', (req, res) => {
  res.json(listResponse(lookups.exchangeTypes, req));
});
router.get('/chain-of-custody/exchange/form', (req, res) => {
  res.json(formDescriptor(dynamicFields.cocExchange.fields, req.query['only-required']));
});

// --- Disposal ---
router.get('/chain-of-custody/disposal/reason', (req, res) => {
  res.json(listResponse(lookups.disposalReasons, req));
});
router.get('/chain-of-custody/disposal/type', (req, res) => {
  res.json(listResponse(lookups.disposalTypes, req));
});
router.get('/chain-of-custody/disposal/form', (req, res) => {
  res.json(formDescriptor(dynamicFields.cocDisposal.fields, req.query['only-required']));
});

// --- Chain of Custody records ---
router.get('/chain-of-custody/:id', (req, res) => {
  const found = findById(store.chainOfCustody, req.params.id);
  if (!found) return notFound(res, 'Chain of Custody');
  res.json(found);
});

// CoCUpdateParams only carries the dynamic group fields — type/evidence_id can't be changed via PUT.
router.put('/chain-of-custody/:id', (req, res) => {
  const found = findById(store.chainOfCustody, req.params.id);
  if (!found) return notFound(res, 'Chain of Custody');
  const group = cocGroupByType[found.type];
  found.fields = applyFieldOverrides(found.fields, group.fields, req.body || {});
  res.json(found);
});

router.delete('/chain-of-custody/:id', (req, res) => {
  const idx = store.chainOfCustody.findIndex((c) => String(c.id) === req.params.id);
  if (idx === -1) return notFound(res, 'Chain of Custody');
  const [removed] = store.chainOfCustody.splice(idx, 1);
  res.json(removed);
});

router.get('/chain-of-custody', (req, res) => {
  res.json(listResponse(store.chainOfCustody, req));
});

router.post('/chain-of-custody', (req, res) => {
  const body = req.body || {};
  const type = cocGroupByType[body.type] ? body.type : 'intake';
  const group = cocGroupByType[type];
  const relatedEvidence = findById(store.evidence, body.evidence_id);
  const ctx = { users: store.users, agencies: store.agencies };
  const record = {
    id: nextId(store.chainOfCustody),
    type,
    evidence_id: body.evidence_id ?? null,
    case_id: relatedEvidence ? relatedEvidence.case_id : null,
    fields: applyFieldOverrides(buildFieldsBag(group.fields, ctx), group.fields, body),
    created_at: new Date().toISOString()
  };
  store.chainOfCustody.push(record);
  res.status(201).json(record);
});

module.exports = router;
