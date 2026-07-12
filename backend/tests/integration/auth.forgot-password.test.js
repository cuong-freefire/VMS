/**
 * Integration Tests: UC07 - Forgot Password
 *
 * Tests cover:
 *   US1+US4 - Request OTP, Verify OTP, Reset Password + Zero Enumeration
 *   US2     - Lockout after 5 wrong OTP attempts
 *   US3     - Resend OTP, Cooldown 60s, OTP Expiry 10min
 *
 * Uses jest.unstable_mockModule for ESM compatibility.
 * Mocks auth.repository.js and email.service.js to isolate business logic.
 *
 * Owner: Member 1 - CuongLH
 * Tasks: T024-T041
 */

import { jest, beforeAll, afterAll, beforeEach, describe, it, expect } from '@jest/globals';
import request from 'supertest';
import bcrypt from 'bcryptjs';

process.env.JWT_KEY = 'test-jwt-key';
process.env.NODE_ENV = 'test';

let app;
let mockRepo;
let mockEmailService;

// ── Predetermined OTP for deterministic testing ──
const PLAIN_OTP = '482931';
const OTP_HASH = bcrypt.hashSync(PLAIN_OTP, 10);

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

  mockEmailService = {
    sendResetPasswordEmail: jest.fn().mockResolvedValue({ success: true }),
    sendVerificationEmail: jest.fn().mockResolvedValue({ success: true }),
    sendEmail: jest.fn().mockResolvedValue({ success: true }),
    sendApprovalEmail: jest.fn().mockResolvedValue({ success: true }),
    sendRejectionEmail: jest.fn().mockResolvedValue({ success: true }),
    sendReminderEmail: jest.fn().mockResolvedValue({ success: true }),
    sendCertificateEmail: jest.fn().mockResolvedValue({ success: true }),
  };

  await jest.unstable_mockModule('../../src/repositories/auth.repository.js', () => ({
    default: mockRepo,
  }));

  await jest.unstable_mockModule('../../src/services/email.service.js', () => ({
    default: mockEmailService,
  }));

  // Mock OTP utility with deterministic OTP
  await jest.unstable_mockModule('../../src/utils/otp.util.js', () => ({
    generateOTP: () => PLAIN_OTP,
    hashOTP: async () => OTP_HASH,
    verifyOTP: async (otp, hash) => bcrypt.compare(otp, hash),
  }));

  const appModule = await import('../../src/app.js');
  app = appModule.default;
});

afterAll(() => {
  jest.restoreAllMocks();
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════
// US1+US4: Forgot Password Request + Zero Enumeration
// ═══════════════════════════════════════════════════════════════

describe('POST /api/v1/auth/forgot-password/request', () => {
  const ACTIVE_USER = {
    id: 1,
    email: 'exists@vms-test.com',
    passwordHash: '$2a$12$somehash',
    isActive: true,
    emailVerified: true,
    role: { name: 'VOLUNTEER' },
  };

  describe('Happy Path — Email exists (US1)', () => {
    it('T024: should return 200 and create OTP record for existing email', async () => {
      mockRepo.findUserByEmail.mockResolvedValue(ACTIVE_USER);
      mockRepo.findVerificationByEmailAndType.mockResolvedValue(null);
      mockRepo.createVerification.mockResolvedValue({ id: 1, email: ACTIVE_USER.email });

      const res = await request(app)
        .post('/api/v1/auth/forgot-password/request')
        .send({ email: ACTIVE_USER.email });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toContain('Nếu email tồn tại');
      expect(res.body.data.cooldown_seconds).toBe(60);
      expect(mockRepo.createVerification).toHaveBeenCalled();
      expect(mockEmailService.sendResetPasswordEmail).toHaveBeenCalled();
    });

    it('should upsert existing OTP record on resend', async () => {
      mockRepo.findUserByEmail.mockResolvedValue(ACTIVE_USER);
      mockRepo.findVerificationByEmailAndType.mockResolvedValue({
        lastSentAt: new Date(Date.now() - 61 * 1000),
        isLocked: false,
        attempts: 2,
        lockedUntil: null,
      });
      mockRepo.updateVerification.mockResolvedValue({});

      const res = await request(app)
        .post('/api/v1/auth/forgot-password/request')
        .send({ email: ACTIVE_USER.email });

      expect(res.status).toBe(200);
      expect(mockRepo.updateVerification).toHaveBeenCalled();
      expect(mockEmailService.sendResetPasswordEmail).toHaveBeenCalled();
    });
  });

  describe('Zero Enumeration — Email does NOT exist (US4)', () => {
    it('T025: should return 200 with identical response for non-existing email', async () => {
      mockRepo.findUserByEmail.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/auth/forgot-password/request')
        .send({ email: 'ghost@vms-test.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toContain('Nếu email tồn tại');
      expect(mockRepo.createVerification).not.toHaveBeenCalled();
      expect(mockRepo.updateVerification).not.toHaveBeenCalled();
      expect(mockEmailService.sendResetPasswordEmail).not.toHaveBeenCalled();
    });

    it('T026: response time variance should be under 100ms', async () => {
      mockRepo.findUserByEmail.mockResolvedValue(null);
      const startGhost = Date.now();
      await request(app)
        .post('/api/v1/auth/forgot-password/request')
        .send({ email: 'ghost@vms-test.com' });
      const timeGhost = Date.now() - startGhost;

      mockRepo.findUserByEmail.mockResolvedValue(ACTIVE_USER);
      mockRepo.findVerificationByEmailAndType.mockResolvedValue({
        lastSentAt: new Date(Date.now() - 61 * 1000),
        isLocked: false,
        attempts: 0,
        lockedUntil: null,
      });
      mockRepo.updateVerification.mockResolvedValue({});
      const startReal = Date.now();
      await request(app)
        .post('/api/v1/auth/forgot-password/request')
        .send({ email: ACTIVE_USER.email });
      const timeReal = Date.now() - startReal;

      const variance = Math.abs(timeReal - timeGhost);
      expect(variance).toBeLessThan(100);
    });
  });

  describe('Validation (400)', () => {
    it('should reject invalid email format', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password/request')
        .send({ email: 'not-an-email' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject empty body', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password/request')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Cooldown 60s (US3 / FR-008)', () => {
    it('T039: should return 429 when cooldown is active', async () => {
      mockRepo.findUserByEmail.mockResolvedValue(ACTIVE_USER);
      mockRepo.findVerificationByEmailAndType.mockResolvedValue({
        lastSentAt: new Date(Date.now() - 30 * 1000),
        isLocked: false,
        attempts: 0,
        lockedUntil: null,
      });

      const res = await request(app)
        .post('/api/v1/auth/forgot-password/request')
        .send({ email: ACTIVE_USER.email });

      expect(res.status).toBe(429);
      expect(res.body.code).toBe('COOLDOWN_ACTIVE');
      expect(res.body.details.remaining_seconds).toBeGreaterThan(0);
    });
  });

  describe('Lockout check BEFORE cooldown (FR-007)', () => {
    it('T033: should return 429 when email is locked, even if cooldown passed', async () => {
      mockRepo.findUserByEmail.mockResolvedValue(ACTIVE_USER);
      mockRepo.findVerificationByEmailAndType.mockResolvedValue({
        lastSentAt: new Date(Date.now() - 120 * 1000),
        isLocked: true,
        lockedUntil: new Date(Date.now() + 10 * 60 * 1000),
      });

      const res = await request(app)
        .post('/api/v1/auth/forgot-password/request')
        .send({ email: ACTIVE_USER.email });

      expect(res.status).toBe(429);
      expect(res.body.code).toBe('EMAIL_LOCKED');
      expect(res.body.details.lock_remaining_seconds).toBeGreaterThan(0);
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// US2: Verify Reset OTP
// ═══════════════════════════════════════════════════════════════

describe('POST /api/v1/auth/forgot-password/verify-otp', () => {
  const ACTIVE_USER = { id: 1, email: 'exists@vms-test.com' };

  const validVerification = {
    otpHash: OTP_HASH,
    lastSendAt: new Date(Date.now() - 1 * 60 * 1000),
    attempts: 0,
    isLocked: false,
    lockedUntil: null,
  };

  describe('Happy Path (US1)', () => {
    it('should return 200 with verified=true when OTP is correct', async () => {
      mockRepo.findVerificationByEmailAndType.mockResolvedValue(validVerification);

      const res = await request(app)
        .post('/api/v1/auth/forgot-password/verify-otp')
        .send({ email: ACTIVE_USER.email, otp: PLAIN_OTP });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.verified).toBe(true);
      expect(res.body.data.message).toContain('xác thực thành công');
    });
  });

  describe('Invalid OTP (US2)', () => {
    it('should return 400 with INVALID_OTP and remaining attempts', async () => {
      mockRepo.findVerificationByEmailAndType.mockResolvedValue(validVerification);
      mockRepo.updateVerification.mockResolvedValue({});

      const res = await request(app)
        .post('/api/v1/auth/forgot-password/verify-otp')
        .send({ email: ACTIVE_USER.email, otp: '111111' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_OTP');
      expect(res.body.message).toContain('còn');
      expect(mockRepo.updateVerification).toHaveBeenCalled();
    });
  });

  describe('Expired OTP (US3)', () => {
    it('T040: should return 400 with OTP_EXPIRED when OTP > 10 min old', async () => {
      mockRepo.findVerificationByEmailAndType.mockResolvedValue({
        ...validVerification,
        lastSendAt: new Date(Date.now() - 11 * 60 * 1000),
      });

      const res = await request(app)
        .post('/api/v1/auth/forgot-password/verify-otp')
        .send({ email: ACTIVE_USER.email, otp: PLAIN_OTP });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('OTP_EXPIRED');
    });
  });

  describe('Not Found (404)', () => {
    it('should return 404 when no OTP record exists', async () => {
      mockRepo.findVerificationByEmailAndType.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/auth/forgot-password/verify-otp')
        .send({ email: 'no-otp@vms-test.com', otp: '111111' });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('VERIFICATION_NOT_FOUND');
    });
  });

  describe('Lockout after 5 wrong attempts (US2)', () => {
    it('T032: should return 429 with EMAIL_LOCKED after 5th wrong attempt', async () => {
      mockRepo.findVerificationByEmailAndType.mockResolvedValue({
        ...validVerification,
        attempts: 4,
      });
      mockRepo.updateVerification.mockResolvedValue({});

      const res = await request(app)
        .post('/api/v1/auth/forgot-password/verify-otp')
        .send({ email: ACTIVE_USER.email, otp: '111111' });

      expect(res.status).toBe(429);
      expect(res.body.code).toBe('EMAIL_LOCKED');
    });

    it('T034: should reject verify when email is already locked', async () => {
      mockRepo.findVerificationByEmailAndType.mockResolvedValue({
        ...validVerification,
        isLocked: true,
        lockedUntil: new Date(Date.now() + 5 * 60 * 1000),
      });

      const res = await request(app)
        .post('/api/v1/auth/forgot-password/verify-otp')
        .send({ email: ACTIVE_USER.email, otp: PLAIN_OTP });

      expect(res.status).toBe(429);
      expect(res.body.code).toBe('EMAIL_LOCKED');
      expect(res.body.details.lock_remaining_seconds).toBeGreaterThan(0);
    });
  });

  describe('Validation (400)', () => {
    it('should reject 5-digit OTP', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password/verify-otp')
        .send({ email: ACTIVE_USER.email, otp: '12345' });
      expect(res.status).toBe(400);
    });

    it('should reject non-numeric OTP', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password/verify-otp')
        .send({ email: ACTIVE_USER.email, otp: 'abcdef' });
      expect(res.status).toBe(400);
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// US1: Reset Password
// ═══════════════════════════════════════════════════════════════

describe('POST /api/v1/auth/forgot-password/reset', () => {
  const ACTIVE_USER = {
    id: 1,
    email: 'exists@vms-test.com',
    passwordHash: '$2a$12$oldhash',
    isActive: true,
  };

  const validVerification = {
    otpHash: OTP_HASH,
    lastSendAt: new Date(Date.now() - 1 * 60 * 1000),
    attempts: 0,
    isLocked: false,
    lockedUntil: null,
  };

  describe('Happy Path (US1)', () => {
    it('T027: should return 200, update password, and delete OTP record', async () => {
      mockRepo.findVerificationByEmailAndType.mockResolvedValue(validVerification);
      mockRepo.findUserByEmail.mockResolvedValue(ACTIVE_USER);
      mockRepo.updatePassword.mockResolvedValue({});
      mockRepo.deleteVerification.mockResolvedValue({});

      const res = await request(app)
        .post('/api/v1/auth/forgot-password/reset')
        .send({
          email: ACTIVE_USER.email,
          otp: PLAIN_OTP,
          newPassword: 'NewStrong@123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toContain('đặt lại thành công');
      expect(mockRepo.updatePassword).toHaveBeenCalled();
      expect(mockRepo.deleteVerification).toHaveBeenCalled();
    });
  });

  describe('Inactive user (403)', () => {
    it('T028: should return 403 ACCOUNT_DISABLED when user is inactive', async () => {
      mockRepo.findVerificationByEmailAndType.mockResolvedValue(validVerification);
      mockRepo.findUserByEmail.mockResolvedValue({ ...ACTIVE_USER, isActive: false });

      const res = await request(app)
        .post('/api/v1/auth/forgot-password/reset')
        .send({
          email: ACTIVE_USER.email,
          otp: PLAIN_OTP,
          newPassword: 'NewStrong@123',
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('ACCOUNT_DISABLED');
    });
  });

  describe('User not found (404)', () => {
    it('should return 404 USER_NOT_FOUND when user does not exist', async () => {
      mockRepo.findVerificationByEmailAndType.mockResolvedValue(validVerification);
      mockRepo.findUserByEmail.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/auth/forgot-password/reset')
        .send({
          email: ACTIVE_USER.email,
          otp: PLAIN_OTP,
          newPassword: 'NewStrong@123',
        });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('USER_NOT_FOUND');
    });
  });

  describe('Invalid OTP on re-verify', () => {
    it('should return 400 when OTP is wrong during reset re-verify', async () => {
      mockRepo.findVerificationByEmailAndType.mockResolvedValue(validVerification);
      mockRepo.updateVerification.mockResolvedValue({});

      const res = await request(app)
        .post('/api/v1/auth/forgot-password/reset')
        .send({
          email: ACTIVE_USER.email,
          otp: '000000',
          newPassword: 'NewStrong@123',
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_OTP');
      expect(mockRepo.updatePassword).not.toHaveBeenCalled();
      expect(mockRepo.deleteVerification).not.toHaveBeenCalled();
    });
  });

  describe('Validation (400)', () => {
    it('should reject weak password (no uppercase)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password/reset')
        .send({
          email: ACTIVE_USER.email,
          otp: '123456',
          newPassword: 'weakpass1!',
        });
      expect(res.status).toBe(400);
    });

    it('should reject password shorter than 8 chars', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password/reset')
        .send({
          email: ACTIVE_USER.email,
          otp: '123456',
          newPassword: 'Ab1!',
        });
      expect(res.status).toBe(400);
    });

    it('should reject password without special char', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password/reset')
        .send({
          email: ACTIVE_USER.email,
          otp: '123456',
          newPassword: 'NoSpecial1',
        });
      expect(res.status).toBe(400);
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// T041: New OTP invalidates old OTP (US3)
// ═══════════════════════════════════════════════════════════════

describe('OTP Invalidation on Resend (US3)', () => {
  const ACTIVE_USER = {
    id: 1,
    email: 'exists@vms-test.com',
    passwordHash: '$2a$12$somehash',
    isActive: true,
    emailVerified: true,
    role: { name: 'VOLUNTEER' },
  };

  it('T041: new OTP should work, old OTP hash should be overwritten', async () => {
    mockRepo.findUserByEmail.mockResolvedValue(ACTIVE_USER);
    mockRepo.findVerificationByEmailAndType.mockResolvedValue(null);
    mockRepo.createVerification.mockResolvedValue({});
    await request(app)
      .post('/api/v1/auth/forgot-password/request')
      .send({ email: ACTIVE_USER.email });

    expect(mockEmailService.sendResetPasswordEmail).toHaveBeenCalledTimes(1);

    mockRepo.findVerificationByEmailAndType.mockResolvedValue({
      lastSentAt: new Date(Date.now() - 61 * 1000),
      isLocked: false,
      attempts: 0,
      lockedUntil: null,
    });
    mockRepo.updateVerification.mockResolvedValue({});
    await request(app)
      .post('/api/v1/auth/forgot-password/request')
      .send({ email: ACTIVE_USER.email });

    expect(mockRepo.updateVerification).toHaveBeenCalled();
    expect(mockEmailService.sendResetPasswordEmail).toHaveBeenCalledTimes(2);
  });
});
