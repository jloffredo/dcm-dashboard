// Helpers for the DCM custom-field system: Case, Evidence, and Chain of Custody records all carry
// a "fields" bag keyed by "<groupId>_<fieldId>" (e.g. "26_1991"), described by the group definitions
// in ../data/dynamicFields.js. See that file's header for where the group/field data comes from.

const { faker } = require('@faker-js/faker');

function valueForType(type, ctx = {}) {
  const t = (type || '').toLowerCase();
  const users = ctx.users || [];
  const agencies = ctx.agencies || [];
  switch (t) {
    case 'text':
      return faker.lorem.words({ min: 1, max: 4 });
    case 'textarea':
      return faker.lorem.sentence();
    case 'date':
      return faker.date.past({ years: 1 }).toISOString().slice(0, 10);
    case 'datetime':
      return faker.date.past({ years: 1 }).toISOString();
    case 'list':
    case 'select':
      return faker.helpers.arrayElement(['Option A', 'Option B', 'Option C', 'Option D']);
    case 'radio':
      return faker.helpers.arrayElement(['Yes', 'No']);
    case 'user':
      return users.length ? `${faker.helpers.arrayElement(users).first_name} ${faker.helpers.arrayElement(users).last_name}` : faker.person.fullName();
    case 'signature':
      return faker.datatype.boolean({ probability: 0.5 }) ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB' : null;
    case 'evidence_identifier':
      return `EV-${faker.string.alphanumeric({ length: 6, casing: 'upper' })}`;
    case 'cid':
      return String(faker.number.int({ min: 1, max: 999999 }));
    case 'agency':
      return agencies.length ? faker.helpers.arrayElement(agencies).title : faker.company.name();
    case 'barcode':
      return faker.string.numeric(12);
    case 'integer':
      return faker.number.int({ min: 1, max: 100 });
    case 'number':
      return faker.number.float({ min: 0, max: 100, fractionDigits: 2 });
    case 'boolean':
    case 'checkbox':
      return faker.datatype.boolean();
    default:
      return faker.lorem.word();
  }
}

function buildFieldsBag(fieldDefs, ctx = {}, overrides = {}) {
  const bag = {};
  for (const f of fieldDefs) {
    const hasOverride = Object.prototype.hasOwnProperty.call(overrides, f.key);
    if (hasOverride) {
      bag[f.key] = { field_id: f.key, value: overrides[f.key] };
      continue;
    }
    const shouldFill = f.required || faker.datatype.boolean({ probability: 0.7 });
    bag[f.key] = { field_id: f.key, value: shouldFill ? valueForType(f.type, ctx) : null };
  }
  return bag;
}

function applyFieldOverrides(bag, fieldDefs, body) {
  const next = { ...bag };
  for (const f of fieldDefs) {
    if (Object.prototype.hasOwnProperty.call(body, f.key)) {
      next[f.key] = { field_id: f.key, value: body[f.key] };
    }
  }
  return next;
}

function formDescriptor(fieldDefs, onlyRequired) {
  const wantRequiredOnly = onlyRequired === 'true' || onlyRequired === true;
  const out = {};
  for (const f of fieldDefs) {
    if (wantRequiredOnly && !f.required) continue;
    out[f.key] = { id: f.id, name: f.name, description: f.description, required: f.required, type: f.type };
  }
  return out;
}

module.exports = { valueForType, buildFieldsBag, applyFieldOverrides, formDescriptor };
