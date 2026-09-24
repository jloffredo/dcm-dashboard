const express = require('express');
const store = require('../data/store');
const lookups = require('../data/lookups');
const { listResponse, nextId, findById, notFound } = require('../utils/helpers');

const router = express.Router();

router.get('/expense/consumable', (req, res) => {
  res.json(listResponse(lookups.consumables, req));
});

router.get('/expense/labor', (req, res) => {
  res.json(listResponse(lookups.laborTypes, req));
});

router.get('/expense/type', (req, res) => {
  res.json(listResponse(lookups.expenseTypes, req));
});

router.get('/expense/department', (req, res) => {
  res.json(listResponse(lookups.departments, req));
});

router.get('/expense/case/:id', (req, res) => {
  const filtered = store.expenses.filter((e) => String(e.case_id) === req.params.id);
  res.json(listResponse(filtered, req));
});

router.get('/expense/:id', (req, res) => {
  const found = findById(store.expenses, req.params.id);
  if (!found) return notFound(res, 'Expense');
  res.json(found);
});

router.put('/expense/:id', (req, res) => {
  const found = findById(store.expenses, req.params.id);
  if (!found) return notFound(res, 'Expense');
  Object.assign(found, req.body, { id: found.id });
  res.json(found);
});

router.delete('/expense/:id', (req, res) => {
  const idx = store.expenses.findIndex((e) => String(e.id) === req.params.id);
  if (idx === -1) return notFound(res, 'Expense');
  const [removed] = store.expenses.splice(idx, 1);
  res.json(removed);
});

router.get('/expense', (req, res) => {
  res.json(listResponse(store.expenses, req));
});

router.post('/expense', (req, res) => {
  const body = req.body || {};
  const expense = {
    id: nextId(store.expenses),
    case_id: null,
    cost: 0,
    expense_date: new Date().toISOString().slice(0, 10),
    type_id: null,
    department_id: null,
    ...body
  };
  if (body.consumable_type_id !== undefined) {
    expense.consumable_id = body.consumable_type_id;
  }
  if (body.labor_type_id !== undefined) {
    expense.labor_id = body.labor_type_id;
  }
  store.expenses.push(expense);
  res.status(201).json(expense);
});

module.exports = router;
