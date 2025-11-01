import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth-middleware';

jest.mock('@/lib/auth-middleware', () => ({
  auth: jest.fn(),
}));

describe('Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call auth function', () => {
    const mockAuth = auth as jest.MockedFunction<typeof auth>;
    mockAuth.mockImplementation((req) => {
      return undefined;
    });

    const req = new NextRequest('http://localhost:3000/test');
    const middleware = require('./middleware').default;

    middleware(req);

    expect(mockAuth).toHaveBeenCalled();
  });

  it('should match correct routes', () => {
    const config = require('./middleware').config;

    expect(config.matcher).toBeDefined();
    expect(Array.isArray(config.matcher)).toBe(true);
  });
});

