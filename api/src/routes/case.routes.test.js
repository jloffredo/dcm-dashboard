const request = require('supertest');
const app = require('../app');

const agent = {
  get: (path) => request(app).get(path).set('api-key', 'test-key'),
  post: (path) => request(app).post(path).set('api-key', 'test-key'),
  put: (path) => request(app).put(path).set('api-key', 'test-key'),
  delete: (path) => request(app).delete(path).set('api-key', 'test-key')
};

describe('GET /case', () => {
  it('returns the seeded list of cases', async () => {
    const res = await agent.get('/service/api/v1/case');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

describe('GET /case/type and /case/permission', () => {
  it('returns the case type lookup list', async () => {
    const res = await agent.get('/service/api/v1/case/type');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns the case permission lookup list', async () => {
    const res = await agent.get('/service/api/v1/case/permission');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /case/form', () => {
  it('returns a descriptor keyed by field id', async () => {
    const res = await agent.get('/service/api/v1/case/form');
    expect(res.status).toBe(200);
    const [firstKey, firstValue] = Object.entries(res.body)[0];
    expect(firstKey).toMatch(/^\d+_\d+$/);
    expect(firstValue).toHaveProperty('type');
  });

  it('filters to required fields only when only-required=true', async () => {
    const full = await agent.get('/service/api/v1/case/form');
    const requiredOnly = await agent.get('/service/api/v1/case/form?only-required=true');
    expect(Object.keys(requiredOnly.body).length).toBeLessThan(Object.keys(full.body).length);
    expect(Object.values(requiredOnly.body).every((f) => f.required)).toBe(true);
  });
});

describe('GET /case/:id', () => {
  it('returns a single case by id', async () => {
    const list = await agent.get('/service/api/v1/case');
    const target = list.body[0];
    const res = await agent.get(`/service/api/v1/case/${target.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(target.id);
  });

  it('returns 404 for an id that does not exist', async () => {
    const res = await agent.get('/service/api/v1/case/999999');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Case not found' });
  });
});

describe('GET /case/by-case-number/:id', () => {
  it('returns a case matching the human-readable case_id', async () => {
    const list = await agent.get('/service/api/v1/case');
    const target = list.body[0];
    const res = await agent.get(`/service/api/v1/case/by-case-number/${target.case_id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(target.id);
  });

  it('returns 404 when the case number is unknown', async () => {
    const res = await agent.get('/service/api/v1/case/by-case-number/NOPE-00000');
    expect(res.status).toBe(404);
  });
});

describe('POST /case', () => {
  it('creates a case with a generated id and case_id', async () => {
    const res = await agent.post('/service/api/v1/case').send({ primary_user_id: 1 });
    expect(res.status).toBe(201);
    expect(res.body.id).toEqual(expect.any(Number));
    expect(res.body.case_id).toMatch(/^\d{4}-\d{5}$/);
    expect(res.body.status).toBe('Open');
    expect(res.body.primary_user_id).toBe(1);
  });

  it('persists the new case so it is retrievable afterward', async () => {
    const created = await agent.post('/service/api/v1/case').send({});
    const fetched = await agent.get(`/service/api/v1/case/${created.body.id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.case_id).toBe(created.body.case_id);
  });
});

describe('PUT /case/:id', () => {
  it('updates dynamic fields and derives the top-level priority/case_type from them', async () => {
    const created = await agent.post('/service/api/v1/case').send({});
    const res = await agent
      .put(`/service/api/v1/case/${created.body.id}`)
      .send({ '1_1236': 'Critical' });
    expect(res.status).toBe(200);
    expect(res.body.fields['1_1236'].value).toBe('Critical');
    expect(res.body.priority.value).toBe('Critical');
  });

  it('returns 404 for an id that does not exist', async () => {
    const res = await agent.put('/service/api/v1/case/999999').send({});
    expect(res.status).toBe(404);
  });
});

describe('DELETE /case/:id', () => {
  it('removes the case and makes it unfetchable afterward', async () => {
    const created = await agent.post('/service/api/v1/case').send({});
    const deleted = await agent.delete(`/service/api/v1/case/${created.body.id}`);
    expect(deleted.status).toBe(200);
    expect(deleted.body.id).toBe(created.body.id);

    const fetched = await agent.get(`/service/api/v1/case/${created.body.id}`);
    expect(fetched.status).toBe(404);
  });

  it('returns 404 for an id that does not exist', async () => {
    const res = await agent.delete('/service/api/v1/case/999999');
    expect(res.status).toBe(404);
  });
});
