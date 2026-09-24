const request = require('supertest');
const app = require('../app');

const agent = {
  get: (path) => request(app).get(path).set('api-key', 'test-key'),
  post: (path) => request(app).post(path).set('api-key', 'test-key'),
  put: (path) => request(app).put(path).set('api-key', 'test-key'),
  delete: (path) => request(app).delete(path).set('api-key', 'test-key')
};

describe('GET /me', () => {
  it("returns the current user's profile without a password field", async () => {
    const res = await agent.get('/service/api/v1/me');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).not.toHaveProperty('password');
  });
});

describe('PUT /me', () => {
  it('updates only the allowed fields', async () => {
    const before = await agent.get('/service/api/v1/me');
    const res = await agent
      .put('/service/api/v1/me')
      .send({ first_name: 'Updated', role_id: 999999 });
    expect(res.status).toBe(200);
    expect(res.body.first_name).toBe('Updated');
    expect(res.body.role_id).toBe(before.body.role_id);
    expect(res.body.id).toBe(before.body.id);
  });
});

describe('GET /user', () => {
  it('returns users without a password field', async () => {
    const res = await agent.get('/service/api/v1/user');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.every((u) => !('password' in u))).toBe(true);
  });

  it('filters by active status when requested', async () => {
    const res = await agent.get('/service/api/v1/user?active=false&length=100');
    expect(res.status).toBe(200);
    expect(res.body.every((u) => u.active === false)).toBe(true);
  });
});

describe('GET /user/:id', () => {
  it('returns a single user', async () => {
    const list = await agent.get('/service/api/v1/user');
    const target = list.body[0];
    const res = await agent.get(`/service/api/v1/user/${target.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(target.id);
  });

  it('returns 404 for an id that does not exist', async () => {
    const res = await agent.get('/service/api/v1/user/999999');
    expect(res.status).toBe(404);
  });
});

describe('GET /user/by-role/:id', () => {
  it('returns only users with the matching role_id', async () => {
    const list = await agent.get('/service/api/v1/user?length=100');
    const roleId = list.body[0].role_id;
    const res = await agent.get(`/service/api/v1/user/by-role/${roleId}`);
    expect(res.status).toBe(200);
    expect(res.body.every((u) => u.role_id === roleId)).toBe(true);
  });
});

describe('POST /user', () => {
  it('creates a user with sensible defaults merged with the request body', async () => {
    const res = await agent
      .post('/service/api/v1/user')
      .send({ first_name: 'New', last_name: 'Person', email: 'new@example.com' });
    expect(res.status).toBe(201);
    expect(res.body.first_name).toBe('New');
    expect(res.body.active).toBe(true);
    expect(res.body.id).toEqual(expect.any(Number));
  });
});

describe('DELETE /user/:id', () => {
  it('soft-disables the user rather than removing it', async () => {
    const created = await agent
      .post('/service/api/v1/user')
      .send({ first_name: 'ToDisable' });
    const res = await agent.delete(`/service/api/v1/user/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.active).toBe(false);

    const fetched = await agent.get(`/service/api/v1/user/${created.body.id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.active).toBe(false);
  });

  it('returns 404 for an id that does not exist', async () => {
    const res = await agent.delete('/service/api/v1/user/999999');
    expect(res.status).toBe(404);
  });
});
