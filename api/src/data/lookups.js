// Static lookup/reference tables used across the DCM domain (roles, types, reasons, etc.)
// These back the various "type"/"reason"/"permission" endpoints described in dcm-api-v1-openapi.yaml.
// Field names below intentionally mirror each endpoint's documented response schema, which is not
// consistent across the real API (some use "value", some "name", one even a capitalized "Description").

const withIds = (values) => values.map((value, i) => ({ id: i + 1, name: value }));

// GET /role — undocumented response schema in the spec; modeled as {id, name} for FK consistency.
const roles = withIds(['Administrator', 'Supervisor', 'Investigator', 'Analyst', 'Read Only']);

// GET /group — same as roles, undocumented; {id, name}.
const groups = withIds([
  'Digital Forensics Unit',
  'Cyber Crimes Unit',
  'Property & Evidence',
  'Command Staff',
  'Financial Crimes'
]);

// GET /case/type -> CaseTypeResponse {id, name}
const caseTypes = withIds(['Criminal', 'Civil', 'Internal Affairs', 'Administrative', 'Cold Case']);

// GET /case/permission -> array<string>
const casePermissions = ['None', 'View', 'Analyst', 'Full Control'];

// GET /asset -> AssetResponse.type is a free string; kept as a lookup for seeding dummy data only.
const assetTypes = withIds(['Write Blocker', 'Forensic Workstation', 'Server', 'Software License', 'Imaging Device']);

// GET /grant -> GovernmentGrantResponse.type is a free string; kept as a lookup for seeding dummy data only.
const grantTypes = withIds(['Federal', 'State', 'Local', 'Private']);

// AgencyParams.category is a free string; no dedicated lookup endpoint in the spec.
const agencyCategories = withIds(['Law Enforcement', 'Government', 'Non-Profit', 'Private Sector']);

// GET /agency/state -> array<string>
const usStates = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD'];

// GET /expense/type -> ExpenseTypeResponse {id, value, cost, description}
const expenseTypes = [
  { id: 1, value: 'Travel', cost: null, description: 'Mileage, lodging, and travel-related expenses' },
  { id: 2, value: 'Equipment', cost: null, description: 'Hardware and equipment purchases' },
  { id: 3, value: 'Training', cost: null, description: 'Training courses and certifications' },
  { id: 4, value: 'Consumable', cost: null, description: 'Consumable supplies used during processing' },
  { id: 5, value: 'Labor', cost: null, description: 'Labor hours billed against the case' },
  { id: 6, value: 'Software License', cost: null, description: 'Software licensing costs' }
];

// GET /expense/consumable -> ExpenseConsumableResponse {id, value, cost, description}
const consumables = [
  { id: 1, value: 'Write Blocker Cable', cost: '15.00', description: 'Cable used with a hardware write blocker' },
  { id: 2, value: 'SATA Cable', cost: '8.00', description: 'Standard SATA data cable' },
  { id: 3, value: 'Evidence Bags', cost: '0.50', description: 'Tamper-evident evidence bag, per unit' },
  { id: 4, value: 'Blank DVDs', cost: '0.75', description: 'Blank DVD-R media, per disc' },
  { id: 5, value: 'External Enclosure', cost: '25.00', description: 'External drive enclosure' }
];

// GET /expense/labor -> ExpenseLaborResponse {id, value, rate, description}
const laborTypes = [
  { id: 1, value: 'Regular', rate: '45.00', description: 'Standard hourly labor rate' },
  { id: 2, value: 'Overtime', rate: '67.50', description: 'Overtime hourly labor rate' },
  { id: 3, value: 'On-Call', rate: '20.00', description: 'On-call standby rate' },
  { id: 4, value: 'Court Time', rate: '55.00', description: 'Court appearance / testimony rate' }
];

// GET /expense/department -> ExpenseDepartmentsResponse {id, name, type, address, phone, email}
const departments = [
  { id: 1, name: 'Digital Forensics', type: 'Investigative', address: '100 Justice Way', phone: '555-010-1001', email: 'digitalforensics@agency.gov' },
  { id: 2, name: 'IT', type: 'Support', address: '100 Justice Way', phone: '555-010-1002', email: 'it@agency.gov' },
  { id: 3, name: 'Property Room', type: 'Custodial', address: '100 Justice Way', phone: '555-010-1003', email: 'propertyroom@agency.gov' },
  { id: 4, name: 'Administration', type: 'Administrative', address: '100 Justice Way', phone: '555-010-1004', email: 'admin@agency.gov' },
  { id: 5, name: 'Finance', type: 'Administrative', address: '100 Justice Way', phone: '555-010-1005', email: 'finance@agency.gov' }
];

// GET /memo/type -> MemoTypeResponse {id, value, description}
const memoTypes = [
  { id: 1, value: 'Case Note', description: 'General case note' },
  { id: 2, value: 'Supervisor Review', description: 'Note logged during supervisor review' },
  { id: 3, value: 'Court Preparation', description: 'Note related to court preparation' },
  { id: 4, value: 'General', description: 'General purpose note' }
];

// GET /forensic-tool/exam-result -> ExamResultResponse {id, value, Description}
const examResultTypes = [
  { id: 1, value: 'Completed - Evidence Found', Description: 'Examination completed with relevant evidence found' },
  { id: 2, value: 'Completed - No Evidence Found', Description: 'Examination completed with no relevant evidence found' },
  { id: 3, value: 'Inconclusive', Description: 'Examination results were inconclusive' },
  { id: 4, value: 'Failed - Device Damaged', Description: 'Examination could not be completed due to device damage' },
  { id: 5, value: 'In Progress', Description: 'Examination is still in progress' }
];

// GET /forensic-tool/forensic-software — the spec's documented schema ref for this endpoint
// (ForensicToolResponse) appears to be a copy/paste error, since that schema describes a forensic
// tool *usage record*, not a software catalog entry. Modeled here as a software catalog instead.
const forensicSoftware = [
  { id: 1, value: 'Cellebrite UFED', description: 'Mobile device extraction', company: 'Cellebrite' },
  { id: 2, value: 'Magnet AXIOM', description: 'Digital forensics platform', company: 'Magnet Forensics' },
  { id: 3, value: 'EnCase', description: 'Forensic imaging & analysis', company: 'OpenText' },
  { id: 4, value: 'FTK', description: 'Forensic Toolkit', company: 'Exterro' },
  { id: 5, value: 'X-Ways Forensics', description: 'Disk analysis & data recovery', company: 'X-Ways Software' },
  { id: 6, value: 'Autopsy', description: 'Open source digital forensics', company: 'Basis Technology' }
];

// Chain of custody reason/type lookups. The spec's documented schema ref for these six endpoints
// (ChainOfCustodyResponse) is a copy/paste error shared across all of them (it describes the intake
// form's field descriptors, not a reason/type lookup). Modeled here as simple {id, value} lookups.
const intakeReasons = withIds(['Seized as Evidence', 'Submitted by Owner', 'Found Property', 'Court Ordered']).map(({ id, name }) => ({ id, value: name }));
const intakeTypes = withIds(['Initial Intake', 'Return from Lab']).map(({ id, name }) => ({ id, value: name }));

const exchangeReasons = withIds(['Transfer to Lab', 'Transfer to Storage', 'Return to Owner', 'Transfer to Agency']).map(({ id, name }) => ({ id, value: name }));
const exchangeTypes = withIds(['Internal Transfer', 'External Transfer']).map(({ id, name }) => ({ id, value: name }));

const disposalReasons = withIds(['Case Closed', 'Court Order', 'No Longer Needed', 'Statute of Limitations Expired']).map(({ id, name }) => ({ id, value: name }));
const disposalTypes = withIds(['Destroyed', 'Returned to Owner', 'Auctioned', 'Transferred to Agency']).map(({ id, name }) => ({ id, value: name }));

module.exports = {
  roles,
  groups,
  caseTypes,
  casePermissions,
  assetTypes,
  grantTypes,
  agencyCategories,
  usStates,
  expenseTypes,
  consumables,
  laborTypes,
  departments,
  memoTypes,
  examResultTypes,
  forensicSoftware,
  intakeReasons,
  intakeTypes,
  exchangeReasons,
  exchangeTypes,
  disposalReasons,
  disposalTypes
};
