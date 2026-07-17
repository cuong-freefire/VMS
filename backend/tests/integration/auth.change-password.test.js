/**
 * Integration Tests: UC06 - Change Password
 *
 * Tests cover:
 *   US1 - Happy path (successful pwd change)
 *   US2 - Old pwd incorrect
 *   US3 - New pwd doesn not meet policy
 *   US4 - Confirm pwd mismatch
 *   US5 - Auth guard (no JWT / expired JWT)
 *
 * Auth strategy: Mock authRepository.getJtiByUserId to return valid session
 * so authMiddleware passes. Generate JWT with matching jti.
 *
 * Owner: Member 1 - CuongLH
 *
 * NOTE: Uses jest.unstable_mockModule for ESM compatibility
 *       (required by --experimental-vm-modules flag).
 */

import { jest, beforeAll, afterAll, beforeEach, describe, it, expect } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

process.env.SECRET_KEY = 'test-secret-key';
process.env.NODE_ENV = 'test';

let app;
let mockRepo;

beforeAll(async () => {
  mockRepo = {
    findVerificationByEmailAndType: jest.fn(),
    findVerificationByEmail: jest.fn(),
    createVerification: jest.fn(),
    updateVerification: jest.fn(),
    deleteVerification: jest.fn(),
    findUserByEmail: jest.fn(),
    createUser: jest.fn(),
    getJtiByUserId: jest.fn(),
    getVolunteerRole: jest.fn(),
    getLoginAttempts: jest.fn(),
    incrementLoginAttempts: jest.fn(),
    resetLoginAttempts: jest.fn(),
    upsertSession: jest.fn(),
    updatePassword: jest.fn(),
    deleteSessionByUserId: jest.fn(),
    findById: jest.fn(),
    updatePasswordById: jest.fn(),
  };

  await jest.unstable_mockModule('../../src/repositories/auth.repository.js', () => ({
    default: mockRepo,
  }));

  const appModule = await import('../../src/app.js');
  app = appModule.default;
});

afterAll(() => {
  jest.restoreAllMocks();
});

function createAuthToken(userId = 1, email = 'testuser@vms-test.com') {
  const jti = userId + '-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  const token = jwt.sign(
    { user_id: userId, email, role_id: 1, jti },
    process.env.SECRET_KEY,
    { expiresIn: '7d' }
  );
  mockRepo.getJtiByUserId.mockResolvedValue({
    jti,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  mockRepo.findUserByEmail.mockResolvedValue({
    id: userId,
    email,
    isActive: true,
    emailVerified: true,
  });
  return { token, userId, email, jti };
}

beforeEach(() => { jest.clearAllMocks(); });

describe('POST /api/v1/auth/change-password - Auth Guard and Happy Path', () => {
  describe('US5 - Auth Guard', () => {
    it('T023 should return 401 without JWT', async () => {
      const res = await request(app).post('/api/v1/auth/change-password').send({
        oldPassword: 'aaaaaaaa', newPassword: 'bbbbbbbb', confirmPassword: 'bbbbbbbb',
      }).expect(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('US1 - Happy Path', () => {
    it('T020 should return 200 when oldPassword correct and newPassword valid', async () => {
      const { token, userId } = createAuthToken();
      const oldHash = await bcrypt.hash('Cccc@1234', 12);
      mockRepo.findById.mockResolvedValue({
        id: userId, email: 'testuser@vms-test.com', passwordHash: oldHash, isActive: true,
      });
      mockRepo.updatePassword.mockResolvedValue({});
      const res = await request(app).post('/api/v1/auth/change-password')
        .set('Cookie', 'token=' + token).send({
          oldPassword: 'Cccc@1234', newPassword: 'Dddd@1234', confirmPassword: 'Dddd@1234',
        }).expect(200);
      expect(res.body.success).toBe(true);
    });

    it('should call updatePassword with email and new hash', async () => {
      const { token, userId } = createAuthToken();
      const oldHash = await bcrypt.hash('Eeee@1234', 12);
      mockRepo.findById.mockResolvedValue({
        id: userId, email: 'testuser@vms-test.com', passwordHash: oldHash, isActive: true,
      });
      mockRepo.updatePasswordById.mockResolvedValue({});
      await request(app).post('/api/v1/auth/change-password')
        .set('Cookie', 'token=' + token).send({
          oldPassword: 'Eeee@1234', newPassword: 'Ffff@1234', confirmPassword: 'Ffff@1234',
        });
      expect(mockRepo.updatePasswordById).toHaveBeenCalledTimes(1);
      const args = mockRepo.updatePasswordById.mock.calls[0];
      expect(args[0]).toBe(userId);
      expect(args[1]).toBeTruthy();
    });

    it('T022 session stays active after pwd change', async () => {
      const { token, userId } = createAuthToken();
      const oldHash = await bcrypt.hash('Gggg@1234', 12);
      mockRepo.findById.mockResolvedValue({
        id: userId, email: 'testuser@vms-test.com', passwordHash: oldHash, isActive: true,
      });
      mockRepo.updatePasswordById.mockResolvedValue({});
      await request(app).post('/api/v1/auth/change-password')
        .set('Cookie', 'token=' + token).send({
          oldPassword: 'Gggg@1234', newPassword: 'Hhhh@1234', confirmPassword: 'Hhhh@1234',
        }).expect(200);
      expect(mockRepo.deleteSessionByUserId).not.toHaveBeenCalled();
    });
  });
});

describe('POST /api/v1/auth/change-password - Error Handling', () => {
  describe('US2 - Wrong Old Password', () => {
    it('T032 should return 400 when oldPassword incorrect', async () => {
      const { token, userId } = createAuthToken();
      const oldHash = await bcrypt.hash('Iiii@1234', 12);
      mockRepo.findById.mockResolvedValue({
        id: userId, email: 'testuser@vms-test.com', passwordHash: oldHash, isActive: true,
      });
      const res = await request(app).post('/api/v1/auth/change-password')
        .set('Cookie', 'token=' + token).send({
          oldPassword: 'wrongOld@1', newPassword: 'Jjjj@1234', confirmPassword: 'Jjjj@1234',
        }).expect(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Mật khẩu cũ không chính xác.');
      expect(mockRepo.updatePasswordById).not.toHaveBeenCalled();
    });
  });

  describe('US3 - Weak New Password', () => {
    it('T033 should return 400 when newPassword shorter than 8 chars', async () => {
      const { token } = createAuthToken();
      const res = await request(app).post('/api/v1/auth/change-password')
        .set('Cookie', 'token=' + token).send({
          oldPassword: 'Kkkk@1234', newPassword: 'short', confirmPassword: 'short',
        }).expect(400);
      expect(res.body.success).toBe(false);
    });

    it('T034 should return 400 when newPassword missing uppercase', async () => {
      const { token } = createAuthToken();
      const res = await request(app).post('/api/v1/auth/change-password')
        .set('Cookie', 'token=' + token).send({
          oldPassword: 'Llll@1234', newPassword: 'nouppercase1@', confirmPassword: 'nouppercase1@',
        }).expect(400);
      expect(res.body.success).toBe(false);
    });

    it('T034 should return 400 when newPassword missing digit', async () => {
      const { token } = createAuthToken();
      const res = await request(app).post('/api/v1/auth/change-password')
        .set('Cookie', 'token=' + token).send({
          oldPassword: 'Mmmm@1234', newPassword: 'nodigitxx@', confirmPassword: 'nodigitxx@',
        }).expect(400);
      expect(res.body.success).toBe(false);
    });

    it('T034 should return 400 when newPassword missing special char', async () => {
      const { token } = createAuthToken();
      const res = await request(app).post('/api/v1/auth/change-password')
        .set('Cookie', 'token=' + token).send({
          oldPassword: 'Nnnn@1234', newPassword: 'nospecial1', confirmPassword: 'nospecial1',
        }).expect(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('US4 - Confirm Mismatch', () => {
    it('T035 should return 400 when confirmPassword differs', async () => {
      const { token } = createAuthToken();
      const res = await request(app).post('/api/v1/auth/change-password')
        .set('Cookie', 'token=' + token).send({
          oldPassword: 'Oooo@1234', newPassword: 'Pppp@1234', confirmPassword: 'Diff@1234',
        }).expect(400);
      expect(res.body.success).toBe(false);
    });
  });
});

describe('POST /api/v1/auth/change-password - Edge Cases and Security', () => {
  it('T040 should return 403 when account inactive', async () => {
    const { token, userId } = createAuthToken();
    const oldHash = await bcrypt.hash('Qqqq@1234', 12);
    mockRepo.findById.mockResolvedValue({
      id: userId, email: 'inactive@vms-test.com', passwordHash: oldHash, isActive: false,
    });
    const res = await request(app).post('/api/v1/auth/change-password')
      .set('Cookie', 'token=' + token).send({
        oldPassword: 'Qqqq@1234', newPassword: 'Rrrr@1234', confirmPassword: 'Rrrr@1234',
      }).expect(403);
    expect(res.body.success).toBe(false);
  });

  it('T042 should unaccept when newPassword equals oldPassword', async () => {
    const { token, userId } = createAuthToken();
    const sameHash = await bcrypt.hash('Same@1234', 12);
    mockRepo.findById.mockResolvedValue({
      id: userId, email: 'testuser@vms-test.com', passwordHash: sameHash, isActive: true,
    });
    mockRepo.updatePasswordById.mockResolvedValue({});
    const res = await request(app).post('/api/v1/auth/change-password')
      .set('Cookie', 'token=' + token).send({
        oldPassword: 'Same@1234', newPassword: 'Same@1234', confirmPassword: 'Same@1234',
      }).expect(400);
    expect(res.body.success).toBe(false);
  });

  it('T043 should NOT expose password_hash in response', async () => {
    const { token, userId } = createAuthToken();
    const oldHash = await bcrypt.hash('Tttt@1234', 12);
    mockRepo.findById.mockResolvedValue({
      id: userId, email: 'testuser@vms-test.com', passwordHash: oldHash, isActive: true,
    });
    mockRepo.updatePasswordById.mockResolvedValue({});
    const res = await request(app).post('/api/v1/auth/change-password')
      .set('Cookie', 'token=' + token).send({
        oldPassword: 'Tttt@1234', newPassword: 'Uuuu@1234', confirmPassword: 'Uuuu@1234',
      }).expect(200);
    const body = JSON.stringify(res.body);
    expect(body).not.toContain('password_hash');
    expect(body).not.toContain('passwordHash');
  });

  it('should return 404 when user not found', async () => {
    const { token } = createAuthToken();
    mockRepo.findById.mockResolvedValue(null);
    const res = await request(app).post('/api/v1/auth/change-password')
      .set('Cookie', 'token=' + token).send({
        oldPassword: 'Vvvv@1234', newPassword: 'Wwww@1234', confirmPassword: 'Wwww@1234',
      }).expect(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Tài khoản không tồn tại.');
  });
});