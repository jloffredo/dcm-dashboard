const request = require('supertest');
const app = require('./app');

describe('GET /', () => {
  it('returns service metadata without requiring auth', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      name: 'DCM V1 Mock API',
      status: 'ok',
      base: '/service/api/v1'
    });
  });
});

describe('api-key auth', () => {
  it('rejects requests under /service/api/v1 with no api-key header', async () => {
    const res = await request(app).get('/service/api/v1/case');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Missing api-key header' });
  });

  it('allows requests through once an api-key header is present', async () => {
    const res = await request(app).get('/service/api/v1/case').set('api-key', 'test-key');
    expect(res.status).toBe(200);
  });
});

describe('unknown routes', () => {
  it('responds 404 with a descriptive error for an unmatched path', async () => {
    const res = await request(app)
      .get('/service/api/v1/does-not-exist')
      .set('api-key', 'test-key');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'No route for GET /service/api/v1/does-not-exist' });
  });
});
