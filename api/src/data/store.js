const { faker } = require('@faker-js/faker');
const lookups = require('./lookups');
const dynamicFields = require('./dynamicFields');
const { buildFieldsBag } = require('../utils/dynamicFields');

// Fixed seed so restarting the dev server doesn't shuffle IDs out from under
// whatever the frontend has cached/linked to.
faker.seed(20260805);

const pick = (arr) => faker.helpers.arrayElement(arr);
const pickId = (arr) => pick(arr).id;
const maybe = (fn, probability = 0.5) => (faker.datatype.boolean({ probability }) ? fn() : null);
const isoDate = (date) => date.toISOString();
const userRef = (u) => (u ? { id: u.id, name: `${u.first_name} ${u.last_name}` } : null);

// ---------------------------------------------------------------------------
// Agencies — AgencyResponse / AgencyParams
// ---------------------------------------------------------------------------
const agencies = Array.from({ length: 8 }, (_, i) => {
  const title = `${faker.location.county()} ${pick(['Police Department', 'Sheriff Office', "Attorney's Office", 'Crime Lab'])}`;
  return {
    id: i + 1,
    title,
    category: pick(lookups.agencyCategories).name,
    initials: title
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 5),
    is_default: i === 0,
    is_enabled: true,
    email: faker.internet.email({ provider: 'agency.gov' }),
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    county: faker.location.county(),
    state: pick(lookups.usStates),
    zip: faker.location.zipCode(),
    phone: faker.phone.number(),
    logo_name: null,
    logo_content: null,
    created_at: isoDate(faker.date.past({ years: 5 }))
  };
});

// ---------------------------------------------------------------------------
// Users — UserResponse / UserParams
// ---------------------------------------------------------------------------
const users = Array.from({ length: 25 }, (_, i) => {
  const first_name = faker.person.firstName();
  const last_name = faker.person.lastName();
  const username = faker.internet.username({ firstName: first_name, lastName: last_name }).toLowerCase();
  return {
    id: i + 1,
    username,
    first_name,
    last_name,
    email: faker.internet.email({ firstName: first_name, lastName: last_name }).toLowerCase(),
    agency_id: pickId(agencies),
    role_id: pickId(lookups.roles),
    group_id: pickId(lookups.groups),
    active: faker.datatype.boolean({ probability: 0.85 }),
    is_active_directory: faker.datatype.boolean({ probability: 0.2 }),
    last_login: isoDate(faker.date.recent({ days: 30 })),
    created_at: isoDate(faker.date.past({ years: 3 }))
  };
});

const currentUser = users[0];

// ---------------------------------------------------------------------------
// Cases — CaseResponse / CaseParams
// ---------------------------------------------------------------------------
const caseFieldDefs = [...dynamicFields.caseCore.fields, ...dynamicFields.casePerson.fields];

// Priority is only exposed as a dynamic "list" field in the spec (no dedicated lookup endpoint),
// so option ids are synthesized locally rather than borrowed from an unrelated lookup.
const PRIORITY_OPTIONS = withIndexIds(['Low', 'Medium', 'High', 'Critical']);
function withIndexIds(values) {
  return values.map((value, i) => ({ id: i + 1, value }));
}

const cases = Array.from({ length: 40 }, (_, i) => {
  const year = faker.date.past({ years: 3 }).getFullYear();
  const case_id = `${year}-${String(i + 1).padStart(5, '0')}`;
  const caseType = pick(lookups.caseTypes);
  const priorityValue = pick(['Low', 'Medium', 'High', 'Critical']);
  const hasDeadline = faker.datatype.boolean({ probability: 0.6 });
  const deadlineDate = hasDeadline ? faker.date.soon({ days: 90 }) : null;
  const deadlineReason = hasDeadline ? pick(['Court Date', 'Statutory Deadline', 'Supervisor Request']) : null;
  const agency = pick(agencies);

  const fields = buildFieldsBag(caseFieldDefs, { users, agencies }, {
    '1_1236': priorityValue,
    '1_1238': deadlineReason,
    '1_1237': deadlineDate ? deadlineDate.toISOString().slice(0, 10) : null,
    '1_1898': caseType.name,
    '1_1250': faker.helpers.arrayElement([
      'Financial Fraud Investigation',
      'Data Breach Response',
      'Employee Misconduct Review',
      'Cyberstalking Complaint',
      'Child Exploitation Investigation',
      'Homicide Digital Evidence Review',
      'Narcotics Trafficking Case',
      'Intellectual Property Theft'
    ])
  });

  return {
    id: i + 1,
    cid: i + 1,
    case_id,
    requested_date: isoDate(faker.date.past({ years: 2 })),
    required_by_date: deadlineDate ? deadlineDate.toISOString().slice(0, 10) : null,
    required_by_reason: deadlineReason ? { id: 1, value: deadlineReason } : { id: null, value: null },
    priority: { option_id: PRIORITY_OPTIONS.find((p) => p.value === priorityValue).id, value: priorityValue },
    agency: { id: agency.id, value: agency.title },
    case_type: { option_id: caseType.id, value: caseType.name },
    fields,
    primary_user_id: pickId(users),
    user_permission: [],
    group_permission: [],
    case_permission_analyst: pickId(lookups.roles),
    case_permission_view: pick(lookups.casePermissions) === 'None' ? 0 : pickId(lookups.roles),
    status: pick(['Open', 'In Progress', 'Pending Review', 'Closed']),
    created_at: isoDate(faker.date.past({ years: 2 })),
    updated_at: isoDate(faker.date.recent({ days: 60 }))
  };
});

// ---------------------------------------------------------------------------
// Evidence — EvidenceResponse / EvidenceParams (per evidence-type fields)
// ---------------------------------------------------------------------------
const evidence = Array.from({ length: 60 }, (_, i) => {
  const relatedCase = pick(cases);
  const evidenceType = pick(dynamicFields.evidenceTypes);
  const isComplete = faker.datatype.boolean({ probability: 0.4 });
  const assignedTo = maybe(() => pick(users), 0.7);
  const triagedBy = maybe(() => pick(users), 0.5);
  const imagedBy = maybe(() => pick(users), 0.4);
  const completedBy = isComplete ? pick(users) : null;

  return {
    id: i + 1,
    case_id: relatedCase.id,
    case_cid: relatedCase.cid,
    case_custom_id: relatedCase.case_id,
    eid: `EV-${String(i + 1).padStart(5, '0')}`,
    display_name: `EV-${String(i + 1).padStart(5, '0')}`,
    type: { id: evidenceType.id, value: evidenceType.name },
    assigned_to: userRef(assignedTo),
    assigned_date: assignedTo ? isoDate(faker.date.past({ years: 1 })) : null,
    triaged_by: userRef(triagedBy),
    triaged_date: triagedBy ? isoDate(faker.date.past({ years: 1 })) : null,
    imaged_by: userRef(imagedBy),
    imaged_date: imagedBy ? isoDate(faker.date.past({ years: 1 })) : null,
    completed_by: userRef(completedBy),
    completed_date: isComplete ? isoDate(faker.date.recent({ days: 90 })) : null,
    fields: buildFieldsBag(dynamicFields.evidenceCommon.fields, { users, agencies }),
    evidence_type_fields: buildFieldsBag(evidenceType.fields, { users, agencies }),
    created_at: isoDate(faker.date.past({ years: 1 }))
  };
});

// ---------------------------------------------------------------------------
// Assets & Grants — AssetResponse / GovernmentGrantResponse (read-only in the spec)
// ---------------------------------------------------------------------------
const grants = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  notes: faker.lorem.sentence(),
  type: pick(lookups.grantTypes).name,
  grant_id: `GR-${faker.date.past({ years: 3 }).getFullYear()}-${String(i + 1).padStart(3, '0')}`,
  expiration_date: isoDate(faker.date.future({ years: 2 })).slice(0, 10)
}));

const assets = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  name: `${pick(lookups.assetTypes).name} ${faker.string.alphanumeric({ length: 4, casing: 'upper' })}`,
  serial: faker.string.alphanumeric({ length: 10, casing: 'upper' }),
  notes: faker.lorem.sentence(),
  license_key: maybe(() => faker.string.uuid(), 0.3),
  type: pick(lookups.assetTypes).name,
  purchase_price: faker.commerce.price({ min: 200, max: 15000 }),
  purchase_date: isoDate(faker.date.past({ years: 4 })).slice(0, 10),
  expiration_date: maybe(() => isoDate(faker.date.future({ years: 2 })).slice(0, 10), 0.4),
  last_renewal_date: maybe(() => isoDate(faker.date.recent({ days: 300 })).slice(0, 10), 0.3),
  renewal_term: maybe(() => pick(['1 year', '2 years', '3 years']), 0.3),
  renewal_cost: maybe(() => faker.commerce.price({ min: 100, max: 5000 }), 0.3),
  assigned_to_id: maybe(() => pickId(users), 0.6),
  assigned_date: maybe(() => isoDate(faker.date.past({ years: 1 })).slice(0, 10), 0.6),
  grant_id: maybe(() => pickId(grants), 0.3)
}));

// ---------------------------------------------------------------------------
// Expenses — ExpenseResponse / ExpenseParams (oneOf consumable | labor)
// ---------------------------------------------------------------------------
const expenses = Array.from({ length: 30 }, (_, i) => {
  const relatedCase = pick(cases);
  const typeValue = pick(lookups.expenseTypes);
  const isConsumable = typeValue.value === 'Consumable';
  const isLabor = typeValue.value === 'Labor';
  const base = {
    id: i + 1,
    case_id: relatedCase.id,
    evidence_id: maybe(() => pickId(evidence), 0.5),
    agency_id: relatedCase.agency.id,
    type_id: typeValue.id,
    department_id: pickId(lookups.departments),
    cost: faker.commerce.price({ min: 10, max: 3000 }),
    expense_date: isoDate(faker.date.past({ years: 1 })).slice(0, 10),
    title: `${typeValue.value} expense`,
    notes: faker.lorem.sentence()
  };
  if (isConsumable) {
    const consumable = pick(lookups.consumables);
    return {
      ...base,
      consumable_type_id: consumable.id,
      consumable_id: consumable.id,
      consumable_quantity: faker.number.int({ min: 1, max: 20 })
    };
  }
  if (isLabor) {
    const labor = pick(lookups.laborTypes);
    return {
      ...base,
      labor_type_id: labor.id,
      labor_id: labor.id,
      labor_hours: faker.number.int({ min: 1, max: 40 })
    };
  }
  return base;
});

// ---------------------------------------------------------------------------
// Memos — MemoResponse / MemoParams
// ---------------------------------------------------------------------------
const memos = Array.from({ length: 25 }, (_, i) => {
  const relatedCase = pick(cases);
  const createdBy = pick(users);
  return {
    id: i + 1,
    case_id: relatedCase.id,
    evidence_id: maybe(() => pickId(evidence), 0.4),
    type_id: pickId(lookups.memoTypes),
    title: faker.lorem.words({ min: 2, max: 5 }),
    note: faker.lorem.paragraph(),
    hours: maybe(() => faker.number.float({ min: 0.5, max: 8, fractionDigits: 1 }), 0.5),
    memo_date: isoDate(faker.date.past({ years: 1 })).slice(0, 10),
    created_date: isoDate(faker.date.past({ years: 1 })),
    created_by: createdBy.id,
    signature: maybe(() => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB', 0.6)
  };
});

// ---------------------------------------------------------------------------
// Forensic Tools — ForensicToolResponse / ForensicToolParams / ForensicToolUpdateParams
// ---------------------------------------------------------------------------
const forensicTools = Array.from({ length: 20 }, (_, i) => {
  const relatedEvidence = pick(evidence);
  const software = pick(lookups.forensicSoftware);
  return {
    id: i + 1,
    forensic_software_id: software.id,
    case_id: relatedEvidence.case_id,
    evidence_id: relatedEvidence.id,
    version: `${faker.number.int({ min: 1, max: 9 })}.${faker.number.int({ min: 0, max: 9 })}.${faker.number.int({ min: 0, max: 9 })}`,
    examiner_id: pickId(users),
    result_id: pickId(lookups.examResultTypes),
    start_date: isoDate(faker.date.past({ years: 1 })).slice(0, 10),
    finish_date: maybe(() => isoDate(faker.date.recent({ days: 60 })).slice(0, 10), 0.6),
    hours: faker.number.float({ min: 0.5, max: 40, fractionDigits: 1 }),
    notes: faker.lorem.sentence()
  };
});

// ---------------------------------------------------------------------------
// Chain of Custody — ChainOfCustodyResponse / CoCParams (CoCIntake|Exchange|DisposalParams)
// ---------------------------------------------------------------------------
const cocGroupByType = {
  intake: dynamicFields.cocIntake,
  exchange: dynamicFields.cocExchange,
  disposal: dynamicFields.cocDisposal
};

const chainOfCustody = Array.from({ length: 35 }, (_, i) => {
  const relatedEvidence = pick(evidence);
  const type = pick(['intake', 'exchange', 'disposal']);
  const group = cocGroupByType[type];
  return {
    id: i + 1,
    type,
    evidence_id: relatedEvidence.id,
    case_id: relatedEvidence.case_id,
    fields: buildFieldsBag(group.fields, { users, agencies }),
    created_at: isoDate(faker.date.past({ years: 1 }))
  };
});

// ---------------------------------------------------------------------------
// API Request Logs — ApiRequestLogResponse
// ---------------------------------------------------------------------------
const logs = Array.from({ length: 50 }, (_, i) => {
  const status = pick([200, 200, 200, 201, 204, 400, 401, 404, 500]);
  const isError = status >= 400;
  return {
    id: i + 1,
    method: pick(['GET', 'POST', 'PUT', 'DELETE']),
    url: pick(['/case', '/evidence', '/user', '/memo', '/expense', '/chain-of-custody', '/agency']),
    userId: pickId(users),
    request_body: {},
    response_body: {},
    error_message: isError ? faker.lorem.sentence() : null,
    error_log: isError ? faker.lorem.sentence() : null,
    created_at: isoDate(faker.date.recent({ days: 30 }))
  };
});

module.exports = {
  agencies,
  users,
  currentUser,
  cases,
  caseFieldDefs,
  PRIORITY_OPTIONS,
  evidence,
  assets,
  grants,
  expenses,
  memos,
  forensicTools,
  chainOfCustody,
  logs
};
