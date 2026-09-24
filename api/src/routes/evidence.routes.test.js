const request = require('supertest');
const app = require('../app');

const agent = {
  get: (path) => request(app).get(path).set('api-key', 'test-key'),
  post: (path) => request(app).post(path).set('api-key', 'test-key'),
  put: (path) => request(app).put(path).set('api-key', 'test-key'),
  delete: (path) => request(app).delete(path).set('api-key', 'test-key')
};

describe('GET /evidence', () => {
  it('returns the seeded list of evidence', async () => {
    const res = await agent.get('/service/api/v1/evidence');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

describe('GET /evidence/:id', () => {
  it('returns a single evidence record', async () => {
    const list = await agent.get('/service/api/v1/evidence');
    const target = list.body[0];
    const res = await agent.get(`/service/api/v1/evidence/${target.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(target.id);
  });

  it('returns 404 for an id that does not exist', async () => {
    const res = await agent.get('/service/api/v1/evidence/999999');
    expect(res.status).toBe(404);
  });
});

describe('GET /evidence/form/:id', () => {
  it('returns 404 for an unknown evidence type', async () => {
    const res = await agent.get('/service/api/v1/evidence/form/999999');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Evidence Type not found' });
  });

  it('merges common and type-specific field descriptors for a known type', async () => {
    const types = await agent.get('/service/api/v1/evidence/type');
    const typeId = types.body[0].id;
    const res = await agent.get(`/service/api/v1/evidence/form/${typeId}`);
    expect(res.status).toBe(200);
    expect(Object.keys(res.body).length).toBeGreaterThan(0);
  });
});

describe('POST /evidence/:caseId', () => {
  it('returns 404 when the parent case does not exist', async () => {
    const res = await agent.post('/service/api/v1/evidence/999999').send({});
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Case not found' });
  });

  it('creates evidence linked to the given case', async () => {
    const cases = await agent.get('/service/api/v1/case');
    const relatedCase = cases.body[0];
    const res = await agent.post(`/service/api/v1/evidence/${relatedCase.id}`).send({});
    expect(res.status).toBe(201);
    expect(res.body.case_id).toBe(relatedCase.id);
    expect(res.body.eid).toMatch(/^EV-\d{5}$/);
  });
});

describe('PUT /evidence/:id', () => {
  it('updates common fields via body overrides', async () => {
    const cases = await agent.get('/service/api/v1/case');
    const created = await agent.post(`/service/api/v1/evidence/${cases.body[0].id}`).send({});
    const fieldKey = Object.keys(created.body.fields)[0];

    const res = await agent
      .put(`/service/api/v1/evidence/${created.body.id}`)
      .send({ [fieldKey]: 'overridden value' });

    expect(res.status).toBe(200);
    expect(res.body.fields[fieldKey].value).toBe('overridden value');
  });

  it('returns 404 for an id that does not exist', async () => {
    const res = await agent.put('/service/api/v1/evidence/999999').send({});
    expect(res.status).toBe(404);
  });
});

describe('DELETE /evidence/:id', () => {
  it('removes the evidence record', async () => {
    const cases = await agent.get('/service/api/v1/case');
    const created = await agent.post(`/service/api/v1/evidence/${cases.body[0].id}`).send({});

    const deleted = await agent.delete(`/service/api/v1/evidence/${created.body.id}`);
    expect(deleted.status).toBe(200);

    const fetched = await agent.get(`/service/api/v1/evidence/${created.body.id}`);
    expect(fetched.status).toBe(404);
  });
});
