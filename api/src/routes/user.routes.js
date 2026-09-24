const express = require('express');
const store = require('../data/store');
const lookups = require('../data/lookups');
const { listResponse, nextId, findById, notFound } = require('../utils/helpers');

const router = express.Router();

function omitPassword(user) {
  const { password, ...rest } = user;
  return rest;
}

router.get('/group', (req, res) => {
  res.json(listResponse(lookups.groups, req));
});

router.get('/role', (req, res) => {
  res.json(listResponse(lookups.roles, req));
});

router.get('/user/by-role/:id', (req, res) => {
  const filtered = store.users.filter((u) => String(u.role_id) === req.params.id);
  res.json(listResponse(filtered.map(omitPassword), req));
});

router.get('/user/:id', (req, res) => {
  const user = findById(store.users, req.params.id);
  if (!user) return notFound(res, 'User');
  res.json(omitPassword(user));
});

// operationId: disableUser — soft-disable rather than remove.
router.delete('/user/:id', (req, res) => {
  const user = findById(store.users, req.params.id);
  if (!user) return notFound(res, 'User');
  user.active = false;
  res.json(omitPassword(user));
});

router.put('/user/:id', (req, res) => {
  const user = findById(store.users, req.params.id);
  if (!user) return notFound(res, 'User');
  Object.assign(user, req.body, { id: user.id });
  res.json(omitPassword(user));
});

router.get('/user', (req, res) => {
  let items = store.users;
  if (req.query.active !== undefined) {
    const active = req.query.active === 'true';
    items = items.filter((u) => u.active === active);
  }
  res.json(listResponse(items.map(omitPassword), req));
});

router.post('/user', (req, res) => {
  const user = {
    id: nextId(store.users),
    first_name: '',
    last_name: '',
    email: '',
    agency_id: null,
    role_id: null,
    active: true,
    is_active_directory: false,
    created_at: new Date().toISOString(),
    ...req.body
  };
  store.users.push(user);
  res.status(201).json(omitPassword(user));
});

router.get('/me', (req, res) => {
  res.json(omitPassword(store.currentUser));
});

router.put('/me', (req, res) => {
  const allowed = ['first_name', 'last_name', 'email', 'password'];
  const updates = Object.fromEntries(allowed.filter((k) => req.body?.[k] !== undefined).map((k) => [k, req.body[k]]));
  Object.assign(store.currentUser, updates, { id: store.currentUser.id });
  res.json(omitPassword(store.currentUser));
});

module.exports = router;
