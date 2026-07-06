import request from 'supertest';
import app from '../../src/app.js';
import jwt from 'jsonwebtoken';

describe('POST /api/v1/auth/logout', () => {
  let validToken;

  beforeAll(() => {
    validToken = jwt.sign(
      { user_id: 1, email: 'test@vms.com', role_id: 2 },
      process.env.SECRET_KEY || 'test-secret',
      { expiresIn: '7d' }
    );
  });

  describe('Success Cases', () => {
    it('should return 200 and clear cookie when authenticated', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', oken = + validToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Đăng xuất thành công');
    });

    it('should set Set-Cookie header with Max-Age=0', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', oken = + validToken)
        .expect(200);

      const setCookie = response.headers['set-cookie'];
      expect(setCookie).toBeDefined();
      const cookieStr = Array.isArray(setCookie) ? setCookie[0] : setCookie;
      expect(cookieStr).toContain('token=;');
      expect(cookieStr).toContain('Max-Age=0');
    });

    it('should return 200 when no cookie (idempotent)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 200 when invalid JWT (idempotent)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', 'token=invalid_token')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 200 when expired JWT (idempotent)', async () => {
      const expiredToken = jwt.sign(
        { user_id: 1, email: 'test@vms.com' },
        process.env.SECRET_KEY || 'test-secret',
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', oken = + expiredToken)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Idempotency', () => {
    it('should handle multiple sequential logout calls', async () => {
      await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', oken = + validToken)
        .expect(200);

      const response2 = await request(app)
        .post('/api/v1/auth/logout')
        .expect(200);

      expect(response2.body.success).toBe(true);

      const response3 = await request(app)
        .post('/api/v1/auth/logout')
        .expect(200);

      expect(response3.body.success).toBe(true);
    });

    it('should return 200 on fifth consecutive call', async () => {
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/api/v1/auth/logout')
          .expect(200);

        expect(response.body.success).toBe(true);
      }
    });
  });

  describe('Cookie Attributes', () => {
    it('should set HttpOnly and SameSite=Lax attributes', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', oken = + validToken)
        .expect(200);

      const setCookie = response.headers['set-cookie'];
      const cookieStr = Array.isArray(setCookie) ? setCookie[0] : setCookie;
      expect(cookieStr).toContain('HttpOnly');
      expect(cookieStr).toContain('SameSite=Lax');
      expect(cookieStr).toContain('Max-Age=0');
    });
  });

  describe('Performance', () => {
    it('should respond in less than 200ms', async () => {
      const startTime = Date.now();

      await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', oken = + validToken)
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(200);
    });
  });
});