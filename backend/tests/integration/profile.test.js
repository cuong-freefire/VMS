/**
 * Integration Test: PATCH /api/v1/user/me (UC19 US1, US2, US3)
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
    updateUserProfile: jest.fn(),
    findVolunteerHistory: jest.fn(),
    countHistoryApplications: jest.fn(),
  };

  await jest.unstable_mockModule('../../src/repositories/profile.repository.js', () => ({
    findUserWithSkills: mockProfileRepo.findUserWithSkills,
    updateUserProfile: mockProfileRepo.updateUserProfile,
    findVolunteerHistory: mockProfileRepo.findVolunteerHistory,
    countHistoryApplications: mockProfileRepo.countHistoryApplications,
  }));

  // ────────── Mock cloudinary.config.js ──────────
  // Must mock the SDK client directly because profile.service.js uses
  // dynamic import("./cloudinary.service.js") at runtime.
  await jest.unstable_mockModule('../../src/config/cloudinary.config.js', () => ({
    default: {
      uploader: {
        upload_stream: jest.fn().mockImplementation((options, callback) => {
          callback(null, {
            public_id: "avatars/test123",
            secure_url: "https://res.cloudinary.com/demo/image/upload/v456/avatars/test123.jpg",
          });
          return { end: jest.fn() };
        }),
        destroy: jest.fn().mockResolvedValue({ result: "ok" }),
      },
    },
  }));

  // Import app AFTER mocking all repositories and services
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
      role: { name: 'VOLUNTEER' },
      userSkills: [],
    });
    mockProfileRepo.updateUserProfile.mockResolvedValue({
      id: 1,
      fullName: 'Nguyễn Văn Updated',
      email: 'test-volunteer@vms-test.com',
      phone: null,
      avatarUrl: null,
      createdAt: new Date('2025-01-01'),
      isActive: true,
      role: { name: 'VOLUNTEER' },
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
      role: { name: 'VOLUNTEER' },
      userSkills: [],
    });
    mockProfileRepo.updateUserProfile.mockResolvedValue({
      id: 1,
      fullName: 'Test User',
      email: 'test-volunteer@vms-test.com',
      phone: '0987654321',
      avatarUrl: null,
      createdAt: new Date('2025-01-01'),
      isActive: true,
      role: { name: 'VOLUNTEER' },
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
      role: { name: 'VOLUNTEER' },
      userSkills: [],
    });
    mockProfileRepo.updateUserProfile.mockResolvedValue({
      id: 1,
      fullName: 'Nguyễn Văn Both',
      email: 'test-volunteer@vms-test.com',
      phone: '0912345678',
      avatarUrl: null,
      createdAt: new Date('2025-01-01'),
      isActive: true,
      role: { name: 'VOLUNTEER' },
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
      role: { name: 'VOLUNTEER' },
      userSkills: [],
    });
    mockProfileRepo.updateUserProfile.mockResolvedValue({
      id: 1,
      fullName: 'Test User',
      email: 'test-volunteer@vms-test.com',
      phone: '0900000000',
      avatarUrl: null,
      createdAt: new Date('2025-01-01'),
      isActive: true,
      role: { name: 'VOLUNTEER' },
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

// ─── UC021: Volunteer History Integration Tests ───

describe("GET /api/v1/user/me/history — Volunteer History (UC021)", () => {
  let authCookie;

  beforeAll(() => {
    const token = createAuthToken();
    authCookie = `token=${token}`;
  });

  it("should return 200 with history, pagination, and summary", async () => {
    mockProfileRepo.findUserWithSkills.mockResolvedValue({ id: 1, isActive: true });
    mockProfileRepo.countHistoryApplications.mockResolvedValue(5);
    mockProfileRepo.findVolunteerHistory.mockResolvedValue([
      { id: 1, status: "APPROVED", createdAt: new Date("2025-06-01"),
        event: { id: 100, title: "Clean the Beach", startDate: new Date("2025-06-15") } },
    ]);

    const res = await request(app).get("/api/v1/user/me/history").set("Cookie", authCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.history).toHaveLength(1);
    expect(res.body.data.history[0].id).toBe(1);
    expect(res.body.data.history[0].status).toBe("APPROVED");
    expect(res.body.data.history[0].event.title).toBe("Clean the Beach");
    expect(res.body.data.pagination.total).toBe(5);
    expect(res.body.data.summary.total).toBe(5);
  });

  it("should filter by status=APPROVED", async () => {
    mockProfileRepo.findUserWithSkills.mockResolvedValue({ id: 1, isActive: true });
    mockProfileRepo.countHistoryApplications.mockResolvedValue(1);
    mockProfileRepo.findVolunteerHistory.mockResolvedValue([
      { id: 2, status: "APPROVED", createdAt: new Date("2025-07-01"),
        event: { id: 101, title: "Tree Planting", startDate: new Date("2025-07-10") } },
    ]);

    const res = await request(app).get("/api/v1/user/me/history?status=APPROVED").set("Cookie", authCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.history).toHaveLength(1);
    expect(res.body.data.history[0].status).toBe("APPROVED");
    expect(res.body.data.history[0].event.title).toBe("Tree Planting");
  });

  it("should filter by year=2025", async () => {
    mockProfileRepo.findUserWithSkills.mockResolvedValue({ id: 1, isActive: true });
    mockProfileRepo.countHistoryApplications.mockResolvedValue(2);
    mockProfileRepo.findVolunteerHistory.mockResolvedValue([
      { id: 3, status: "APPROVED", createdAt: new Date("2025-03-01"),
        event: { id: 102, title: "Food Drive", startDate: new Date("2025-03-15") } },
    ]);

    const res = await request(app).get("/api/v1/user/me/history?year=2025").set("Cookie", authCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.history).toHaveLength(1);
    expect(res.body.data.history[0].event.title).toBe("Food Drive");
  });

  it("should return 401 for unauthenticated request", async () => {
    const res = await request(app).get("/api/v1/user/me/history");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 for invalid status", async () => {
    const res = await request(app)
      .get("/api/v1/user/me/history?status=INVALID")
      .set("Cookie", authCookie);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("should return 400 for invalid year format", async () => {
    const res = await request(app)
      .get("/api/v1/user/me/history?year=20")
      .set("Cookie", authCookie);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return empty history with zero counts for user with no applications", async () => {
    mockProfileRepo.findUserWithSkills.mockResolvedValue({ id: 1, isActive: true });
    mockProfileRepo.countHistoryApplications.mockResolvedValue(0);
    mockProfileRepo.findVolunteerHistory.mockResolvedValue([]);

    const res = await request(app).get("/api/v1/user/me/history").set("Cookie", authCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.history).toHaveLength(0);
    expect(res.body.data.pagination.total).toBe(0);
    expect(res.body.data.summary.total).toBe(0);
  });
});

// ─── US2: Image Upload Integration Tests (T016) ───

describe("PATCH /api/v1/user/me — Image Upload (US2)", () => {
  let authCookie;

  beforeAll(() => {
    const token = createAuthToken();
    authCookie = `token=${token}`;
  });

  it("should upload valid jpg image and return 200 with new avatar_url", async () => {
    mockProfileRepo.findUserWithSkills.mockResolvedValue({
      id: 1,
      fullName: "Test User",
      email: "test-volunteer@vms-test.com",
      phone: "0900000000",
      avatarUrl: null,
      createdAt: new Date("2025-01-01"),
      isActive: true,
      role: { name: "VOLUNTEER" },
      userSkills: [],
    });
    mockProfileRepo.updateUserProfile.mockResolvedValue({
      id: 1,
      fullName: "Test User",
      email: "test-volunteer@vms-test.com",
      phone: "0900000000",
      avatarUrl: "https://res.cloudinary.com/demo/image/upload/v456/avatars/test123.jpg",
      createdAt: new Date("2025-01-01"),
      isActive: true,
      role: { name: "VOLUNTEER" },
      userSkills: [],
    });

    const res = await request(app)
      .patch("/api/v1/user/me")
      .set("Cookie", authCookie)
      .attach("avatar", Buffer.from("fake-image-data"), "test.jpg");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.avatar_url).toBe("https://res.cloudinary.com/demo/image/upload/v456/avatars/test123.jpg");
  });

  it("should return 400 for unsupported file format (gif)", async () => {
    const res = await request(app)
      .patch("/api/v1/user/me")
      .set("Cookie", authCookie)
      .attach("avatar", Buffer.from("GIF89a"), "test.gif");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 413 for file exceeding 5MB", async () => {
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024);

    const res = await request(app)
      .patch("/api/v1/user/me")
      .set("Cookie", authCookie)
      .attach("avatar", largeBuffer, "large.jpg");

    expect(res.status).toBe(413);
    expect(res.body.success).toBe(false);
  });
});

// ─── US3: Combined Update Integration Tests (T021) ───

describe("PATCH /api/v1/user/me — Combined Update (US3)", () => {
  let authCookie;

  beforeAll(() => {
    const token = createAuthToken();
    authCookie = `token=${token}`;
  });

  it("should update full_name + phone_number + avatar in same request (200)", async () => {
    mockProfileRepo.findUserWithSkills.mockResolvedValue({
      id: 1,
      fullName: "Old Name",
      email: "test-volunteer@vms-test.com",
      phone: "0900000000",
      avatarUrl: null,
      createdAt: new Date("2025-01-01"),
      isActive: true,
      role: { name: "VOLUNTEER" },
      userSkills: [],
    });
    mockProfileRepo.updateUserProfile.mockResolvedValue({
      id: 1,
      fullName: "New Name",
      email: "test-volunteer@vms-test.com",
      phone: "0911111111",
      avatarUrl: "https://res.cloudinary.com/demo/image/upload/v456/avatars/test123.jpg",
      createdAt: new Date("2025-01-01"),
      isActive: true,
      role: { name: "VOLUNTEER" },
      userSkills: [],
    });

    const res = await request(app)
      .patch("/api/v1/user/me")
      .set("Cookie", authCookie)
      .field("full_name", "New Name")
      .field("phone_number", "0911111111")
      .attach("avatar", Buffer.from("fake-image-data"), "test.jpg");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.full_name).toBe("New Name");
    expect(res.body.data.phone_number).toBe("0911111111");
    expect(res.body.data.avatar_url).toBe("https://res.cloudinary.com/demo/image/upload/v456/avatars/test123.jpg");
  });

  it("should reject entire request when file exceeds 5MB even with valid text", async () => {
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024);

    const res = await request(app)
      .patch("/api/v1/user/me")
      .set("Cookie", authCookie)
      .field("full_name", "Valid Name")
      .field("phone_number", "0987654321")
      .attach("avatar", largeBuffer, "large.jpg");

    expect(res.status).toBe(413);
    expect(res.body.success).toBe(false);
  });

  it("should reject entire request for invalid text even with valid image", async () => {
    const res = await request(app)
      .patch("/api/v1/user/me")
      .set("Cookie", authCookie)
      .field("phone_number", "123")
      .attach("avatar", Buffer.from("fake-image"), "test.jpg");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});