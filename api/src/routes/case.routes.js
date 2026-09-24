const express = require('express');
const store = require('../data/store');
const lookups = require('../data/lookups');
const dynamicFields = require('../data/dynamicFields');
const { listResponse, nextId, findById, notFound } = require('../utils/helpers');
const { buildFieldsBag, applyFieldOverrides, formDescriptor } = require('../utils/dynamicFields');

const router = express.Router();

function caseTopLevelFromFields(fields) {
  const priorityValue = fields['1_1236']?.value ?? null;
  const caseTypeValue = fields['1_1898']?.value ?? null;
  const deadlineDate = fields['1_1237']?.value ?? null;
  const deadlineReason = fields['1_1238']?.value ?? null;
  const matchedType = lookups.caseTypes.find((t) => t.name === caseTypeValue);
  const matchedPriority = store.PRIORITY_OPTIONS.find((p) => p.value === priorityValue);
  return {
    priority: { option_id: matchedPriority ? matchedPriority.id : null, value: priorityValue },
    case_type: { option_id: matchedType ? matchedType.id : null, value: caseTypeValue },
    required_by_date: deadlineDate,
    required_by_reason: deadlineReason ? { id: null, value: deadlineReason } : { id: null, value: null }
  };
}

router.get('/case/type', (req, res) => {
  res.json(listResponse(lookups.caseTypes, req));
});

router.get('/case/permission', (req, res) => {
  res.json(listResponse(lookups.casePermissions, req));
});

router.get('/case/form', (req, res) => {
  const onlyRequired = req.query['only-required'];
  res.json(formDescriptor(dynamicFields.caseCore.fields, onlyRequired));
});

router.get('/case/by-case-number/:id', (req, res) => {
  const found = store.cases.find((c) => c.case_id === req.params.id);
  if (!found) return notFound(res, 'Case');
  res.json(found);
});

router.get('/case/:id', (req, res) => {
  const found = findById(store.cases, req.params.id);
  if (!found) return notFound(res, 'Case');
  res.json(found);
});

router.put('/case/:id', (req, res) => {
  const found = findById(store.cases, req.params.id);
  if (!found) return notFound(res, 'Case');
  const body = req.body || {};
  const fields = applyFieldOverrides(found.fields, store.caseFieldDefs, body);
  Object.assign(found, body, caseTopLevelFromFields(fields), {
    id: found.id,
    fields,
    updated_at: new Date().toISOString()
  });
  res.json(found);
});

router.delete('/case/:id', (req, res) => {
  const idx = store.cases.findIndex((c) => String(c.id) === req.params.id);
  if (idx === -1) return notFound(res, 'Case');
  const [removed] = store.cases.splice(idx, 1);
  res.json(removed);
});

router.get('/case', (req, res) => {
  res.json(listResponse(store.cases, req));
});

router.post('/case', (req, res) => {
  const id = nextId(store.cases);
  const body = req.body || {};
  const year = new Date().getFullYear();
  const agency = findById(store.agencies, body.agency_id) || store.agencies[0];
  const fields = applyFieldOverrides(
    buildFieldsBag(store.caseFieldDefs, { users: store.users, agencies: store.agencies }),
    store.caseFieldDefs,
    body
  );
  const newCase = {
    id,
    cid: id,
    case_id: `${year}-${String(id).padStart(5, '0')}`,
    requested_date: new Date().toISOString(),
    agency: { id: agency.id, value: agency.title },
    ...caseTopLevelFromFields(fields),
    fields,
    primary_user_id: body.primary_user_id ?? null,
    user_permission: body.user_permission ?? [],
    group_permission: body.group_permission ?? [],
    case_permission_analyst: body.case_permission_analyst ?? 0,
    case_permission_view: body.case_permission_view ?? 0,
    status: 'Open',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  store.cases.push(newCase);
  res.status(201).json(newCase);
});

module.exports = router;
