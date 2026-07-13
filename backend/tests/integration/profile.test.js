/**
 * Integration Test: PATCH /api/v1/user/me — Text update (UC19 US1)
 *
 * Auth strategy: Mock authRepository.getJtiByUserId + profileRepository
 * so test runs without real database. Generate JWT with matching jti.
 *
 * Uses jest.unstable_mockModule for ESM compatibility
 * (required by --experimental-vm-modules flag).
 *
 * Owner: Member 1 - CuongLH
 * Module: Profile Management
 */

import { jest, beforeAll, afterAll, describe, it, expect } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';

process.env.SECRET_KEY = 'test-secret-key';
process.env.NODE_ENV = 'test';

let app;
let mockAuthRepo;
let mockProfileRepo;

beforeAll(async () => {
  // ────────── Mock auth.repository.js ──────────
  mockAuthRepo = {
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
    default: mockAuthRepo,
  }));

  // ────────── Mock profile.repository.js ──────────
  mockProfileRepo = {
    findUserWithSkills: jest.fn(),
    updateUser: jest.fn(),
  };

  await jest.unstable_mockModule('../../src/repositories/profile.repository.js', () => ({
    findUserWithSkills: mockProfileRepo.findUserWithSkills,
    updateUser: mockProfileRepo.updateUser,
  }));

  // Import app AFTER mocking all repositories
  const appModule = await import('../../src/app.js');
  app = appModule.default;
});

afterAll(() => {
  jest.restoreAllMocks();
});

/**
 * Tạo JWT token và setup mock authRepository để authMiddleware pass.
 */
function createAuthToken(userId = 1, email = 'test-volunteer@vms-test.com') {
  const jti = userId + '-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  const token = jwt.sign(
    { user_id: userId, email, role_id: 1, jti },
    process.env.SECRET_KEY,
    { expiresIn: '7d' }
  );
  mockAuthRepo.getJtiByUserId.mockResolvedValue({
    jti,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  mockAuthRepo.findUserByEmail.mockResolvedValue({
    id: userId,
    email,
    isActive: true,
    emailVerified: true,
  });
  return token;
}

describe("PATCH /api/v1/user/me — Text update", () => {
  let authCookie;

  beforeAll(() => {
    const token = createAuthToken();
    authCookie = `token=${token}`;
  });

  it("should update full_name successfully (200)", async () => {
    mockProfileRepo.findUserWithSkills.mockResolvedValue({
      id: 1,
      fullName: 'Old Name',
      email: 'test-volunteer@vms-test.com',
      phone: null,
      avatarUrl: null,
      createdAt: new Date('2025-01-01'),
      isActive: true,
      userSkills: [],
    });
    mockProfileRepo.updateUser.mockResolvedValue({
      id: 1,
      fullName: 'Nguyễn Văn Updated',
      email: 'test-volunteer@vms-test.com',
      phone: null,
      avatarUrl: null,
      createdAt: new Date('2025-01-01'),
      isActive: true,
      userSkills: [],
    });

    const res = await request(app)
      .patch("/api/v1/user/me")
      .set("Cookie", authCookie)
      .send({ full_name: "Nguyễn Văn Updated" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.full_name).toBe("Nguyễn Văn Updated");
  });

  it("should update phone_number successfully (200)", async () => {
    mockProfileRepo.findUserWithSkills.mockResolvedValue({
      id: 1,
      fullName: 'Test User',
      email: 'test-volunteer@vms-test.com',
      phone: '0900000000',
      avatarUrl: null,
      createdAt: new Date('2025-01-01'),
      isActive: true,
      userSkills: [],
    });
    mockProfileRepo.updateUser.mockResolvedValue({
      id: 1,
      fullName: 'Test User',
      email: 'test-volunteer@vms-test.com',
      phone: '0987654321',
      avatarUrl: null,
      createdAt: new Date('2025-01-01'),
      isActive: true,
      userSkills: [],
    });

    const res = await request(app)
      .patch("/api/v1/user/me")
      .set("Cookie", authCookie)
      .send({ phone_number: "0987654321" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.phone_number).toBe("0987654321");
  });

  it("should update both full_name and phone_number (200)", async () => {
    mockProfileRepo.findUserWithSkills.mockResolvedValue({
      id: 1,
      fullName: 'Old Name',
      email: 'test-volunteer@vms-test.com',
      phone: '0900000000',
      avatarUrl: null,
      createdAt: new Date('2025-01-01'),
      isActive: true,
      userSkills: [],
    });
    mockProfileRepo.updateUser.mockResolvedValue({
      id: 1,
      fullName: 'Nguyễn Văn Both',
      email: 'test-volunteer@vms-test.com',
      phone: '0912345678',
      avatarUrl: null,
      createdAt: new Date('2025-01-01'),
      isActive: true,
      userSkills: [],
    });

    const res = await request(app)
      .patch("/api/v1/user/me")
      .set("Cookie", authCookie)
      .send({ full_name: "Nguyễn Văn Both", phone_number: "0912345678" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.full_name).toBe("Nguyễn Văn Both");
    expect(res.body.data.phone_number).toBe("0912345678");
  });

  it("should return 200 with no changes for empty body", async () => {
    mockProfileRepo.findUserWithSkills.mockResolvedValue({
      id: 1,
      fullName: 'Test User',
      email: 'test-volunteer@vms-test.com',
      phone: '0900000000',
      avatarUrl: null,
      createdAt: new Date('2025-01-01'),
      isActive: true,
      userSkills: [],
    });
    mockProfileRepo.updateUser.mockResolvedValue({
      id: 1,
      fullName: 'Test User',
      email: 'test-volunteer@vms-test.com',
      phone: '0900000000',
      avatarUrl: null,
      createdAt: new Date('2025-01-01'),
      isActive: true,
      userSkills: [],
    });

    const res = await request(app)
      .patch("/api/v1/user/me")
      .set("Cookie", authCookie)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should return 400 for invalid full_name (quá ngắn)", async () => {
    const res = await request(app)
      .patch("/api/v1/user/me")
      .set("Cookie", authCookie)
      .send({ full_name: "A" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 for invalid phone_number", async () => {
    const res = await request(app)
      .patch("/api/v1/user/me")
      .set("Cookie", authCookie)
      .send({ phone_number: "123" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 401 for unauthenticated request", async () => {
    const res = await request(app)
      .patch("/api/v1/user/me")
      .send({ full_name: "Test" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should validate and block unknown fields sent by client", async () => {
    const res = await request(app)
      .patch("/api/v1/user/me")
      .set("Cookie", authCookie)
      .send({ full_name: "Valid Name", email: "hacked@evil.com", password: "abc12345" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});