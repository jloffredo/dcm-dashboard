const express = require('express');
const store = require('../data/store');
const lookups = require('../data/lookups');
const { listResponse, nextId, findById, notFound } = require('../utils/helpers');

const router = express.Router();

router.get('/forensic-tool/exam-result', (req, res) => {
  res.json(listResponse(lookups.examResultTypes, req));
});

router.get('/forensic-tool/forensic-software', (req, res) => {
  res.json(listResponse(lookups.forensicSoftware, req));
});

router.get('/forensic-tool/:id', (req, res) => {
  const found = findById(store.forensicTools, req.params.id);
  if (!found) return notFound(res, 'Forensic Tool');
  res.json(found);
});

router.put('/forensic-tool/:id', (req, res) => {
  const found = findById(store.forensicTools, req.params.id);
  if (!found) return notFound(res, 'Forensic Tool');
  Object.assign(found, req.body, { id: found.id });
  res.json(found);
});

router.delete('/forensic-tool/:id', (req, res) => {
  const idx = store.forensicTools.findIndex((t) => String(t.id) === req.params.id);
  if (idx === -1) return notFound(res, 'Forensic Tool');
  const [removed] = store.forensicTools.splice(idx, 1);
  res.json(removed);
});

router.get('/forensic-tool', (req, res) => {
  res.json(listResponse(store.forensicTools, req));
});

router.post('/forensic-tool', (req, res) => {
  const tool = {
    id: nextId(store.forensicTools),
    forensic_software_id: null,
    evidence_id: null,
    version: '',
    examiner_id: null,
    result_id: null,
    start_date: new Date().toISOString(),
    finish_date: null,
    hours: 0,
    notes: '',
    ...req.body
  };
  store.forensicTools.push(tool);
  res.status(201).json(tool);
});

module.exports = router;
