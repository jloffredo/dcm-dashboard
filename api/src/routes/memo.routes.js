const express = require('express');
const store = require('../data/store');
const lookups = require('../data/lookups');
const { listResponse, nextId, findById, notFound } = require('../utils/helpers');

const router = express.Router();

router.get('/memo/type', (req, res) => {
  res.json(listResponse(lookups.memoTypes, req));
});

router.get('/memo/case/:id', (req, res) => {
  const filtered = store.memos.filter((m) => String(m.case_id) === req.params.id);
  res.json(listResponse(filtered, req));
});

router.get('/memo/:id', (req, res) => {
  const found = findById(store.memos, req.params.id);
  if (!found) return notFound(res, 'Memo');
  res.json(found);
});

router.put('/memo/:id', (req, res) => {
  const found = findById(store.memos, req.params.id);
  if (!found) return notFound(res, 'Memo');
  Object.assign(found, req.body, { id: found.id });
  res.json(found);
});

router.delete('/memo/:id', (req, res) => {
  const idx = store.memos.findIndex((m) => String(m.id) === req.params.id);
  if (idx === -1) return notFound(res, 'Memo');
  const [removed] = store.memos.splice(idx, 1);
  res.json(removed);
});

router.get('/memo', (req, res) => {
  res.json(listResponse(store.memos, req));
});

router.post('/memo', (req, res) => {
  const memo = {
    id: nextId(store.memos),
    title: '',
    case_id: null,
    type_id: null,
    memo_date: new Date().toISOString().slice(0, 10),
    created_date: new Date().toISOString(),
    created_by: store.currentUser.id,
    ...req.body
  };
  store.memos.push(memo);
  res.status(201).json(memo);
});

module.exports = router;
