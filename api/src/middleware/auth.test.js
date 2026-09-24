const { apiKeyAuth } = require('./auth');

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('apiKeyAuth', () => {
  it('responds 401 when the api-key header is missing', () => {
    const req = { header: () => undefined };
    const res = mockRes();
    const next = vi.fn();

    apiKeyAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing api-key header' });
    expect(next).not.toHaveBeenCalled();
  });

  it('responds 401 when the api-key header is an empty string', () => {
    const req = { header: () => '' };
    const res = mockRes();
    const next = vi.fn();

    apiKeyAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('attaches the key to the request and calls next when a key is present', () => {
    const req = { header: () => 'any-non-empty-value' };
    const res = mockRes();
    const next = vi.fn();

    apiKeyAuth(req, res, next);

    expect(req.apiKey).toBe('any-non-empty-value');
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });
});
