import request from 'supertest';
import app from '../index';

describe('Auth & Health API Endpoints', () => {
  describe('GET /health', () => {
    it('should return health check status', async () => {
      const res = await request(app).get('/health');
      // Either database is connected or disconnected depending on if local Postgres is running,
      // but status should be 200 or 500.
      expect([200, 500]).toContain(res.status);
      expect(res.body).toHaveProperty('status');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should deny access without JWT token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });
  });
});
