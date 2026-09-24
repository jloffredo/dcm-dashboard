const express = require('express');
const store = require('../data/store');
const dynamicFields = require('../data/dynamicFields');
const { listResponse, nextId, findById, notFound } = require('../utils/helpers');
const { buildFieldsBag, applyFieldOverrides, formDescriptor } = require('../utils/dynamicFields');

const router = express.Router();

function findEvidenceType(id) {
  return dynamicFields.evidenceTypes.find((t) => String(t.id) === String(id));
}

router.get('/evidence/type', (req, res) => {
  res.json(dynamicFields.evidenceTypes.map((t) => ({ id: t.id, name: t.name, description: t.description })));
});

router.get('/evidence/form/:id', (req, res) => {
  const evidenceType = findEvidenceType(req.params.id);
  if (!evidenceType) return notFound(res, 'Evidence Type');
  const onlyRequired = req.query['only-required'];
  res.json({
    ...formDescriptor(dynamicFields.evidenceCommon.fields, onlyRequired),
    ...formDescriptor(evidenceType.fields, onlyRequired)
  });
});

router.get('/evidence/:id', (req, res) => {
  const found = findById(store.evidence, req.params.id);
  if (!found) return notFound(res, 'Evidence');
  res.json(found);
});

router.post('/evidence/:caseId', (req, res) => {
  const relatedCase = findById(store.cases, req.params.caseId);
  if (!relatedCase) return notFound(res, 'Case');
  const body = req.body || {};
  const evidenceType = findEvidenceType(body.type_id) || dynamicFields.evidenceTypes[0];
  const id = nextId(store.evidence);
  const ctx = { users: store.users, agencies: store.agencies };
  const item = {
    id,
    case_id: relatedCase.id,
    case_cid: relatedCase.cid,
    case_custom_id: relatedCase.case_id,
    eid: `EV-${String(id).padStart(5, '0')}`,
    display_name: `EV-${String(id).padStart(5, '0')}`,
    type: { id: evidenceType.id, value: evidenceType.name },
    assigned_to: null,
    assigned_date: body.assigned_date ?? null,
    triaged_by: null,
    triaged_date: body.triaged_date ?? null,
    imaged_by: null,
    imaged_date: body.imaged_date ?? null,
    completed_by: null,
    completed_date: body.completed_date ?? null,
    fields: applyFieldOverrides(buildFieldsBag(dynamicFields.evidenceCommon.fields, ctx), dynamicFields.evidenceCommon.fields, body),
    evidence_type_fields: applyFieldOverrides(buildFieldsBag(evidenceType.fields, ctx), evidenceType.fields, body),
    created_at: new Date().toISOString()
  };
  store.evidence.push(item);
  res.status(201).json(item);
});

router.put('/evidence/:id', (req, res) => {
  const found = findById(store.evidence, req.params.id);
  if (!found) return notFound(res, 'Evidence');
  const body = req.body || {};
  const evidenceType = findEvidenceType(body.type_id) || findEvidenceType(found.type.id);
  Object.assign(found, body, {
    id: found.id,
    type: { id: evidenceType.id, value: evidenceType.name },
    fields: applyFieldOverrides(found.fields, dynamicFields.evidenceCommon.fields, body),
    evidence_type_fields: applyFieldOverrides(found.evidence_type_fields, evidenceType.fields, body)
  });
  res.json(found);
});

router.delete('/evidence/:id', (req, res) => {
  const idx = store.evidence.findIndex((e) => String(e.id) === req.params.id);
  if (idx === -1) return notFound(res, 'Evidence');
  const [removed] = store.evidence.splice(idx, 1);
  res.json(removed);
});

router.get('/evidence', (req, res) => {
  res.json(listResponse(store.evidence, req));
});

module.exports = router;
