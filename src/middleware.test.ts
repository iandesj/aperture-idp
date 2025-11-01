jest.mock('@/lib/auth-middleware', () => ({
  auth: jest.fn(),
}));

describe('Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have correct configuration', () => {
    const config = require('./middleware').config;

    expect(config.matcher).toBeDefined();
    expect(Array.isArray(config.matcher)).toBe(true);
    expect(config.matcher[0]).toContain('api/auth');
  });
});

