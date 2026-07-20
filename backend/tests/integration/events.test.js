/**
 * Integration Tests: UC09 - View Event Detail
 *
 * Tests cover:
 *  - Guest request (no auth) → 200 + full event detail
 *  - Authenticated request → 200 + userApplication
 *  - Authenticated request without application → 200 + userApplication: null
 *  - Invalid event ID (non-integer) → 400
 *  - Non-existent event → 404
 *
 * Owner: Member 1 - CuongLH
 */

import { jest, beforeAll, afterAll, beforeEach, describe, it, expect } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";

process.env.SECRET_KEY = "test-secret-key";
process.env.NODE_ENV = "test";

let app;
let mockEventRepo;
let mockAppRepo;
let mockAuthRepo;

beforeAll(async () => {
    mockEventRepo = { findByIdWithRelations: jest.fn() };
    mockAppRepo = { findByUserAndEvent: jest.fn() };
    mockAuthRepo = {
        getJtiByUserId: jest.fn(),
        findUserByEmail: jest.fn(),
    };

    await jest.unstable_mockModule("../../src/repositories/event.repository.js", () => ({
        default: mockEventRepo,
    }));

    await jest.unstable_mockModule("../../src/repositories/application.repository.js", () => ({
        default: mockAppRepo,
    }));

    await jest.unstable_mockModule("../../src/repositories/auth.repository.js", () => ({
        default: mockAuthRepo,
    }));

    const appModule = await import("../../src/app.js");
    app = appModule.default;
});

afterAll(() => {
    jest.restoreAllMocks();
});

beforeEach(() => {
    jest.clearAllMocks();
});

/**
 * Helper: Build a valid JWT + mock authRepo for middleware
 */
function createAuthToken(userId = 5, email = "volunteer@vms-test.com") {
    const jti = userId + "-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
    const token = jwt.sign(
        { user_id: userId, email, role_id: 2, jti },
        process.env.SECRET_KEY,
        { expiresIn: "7d" }
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
    return { token, userId };
}

// ───  Mock event data ──────────────────────────────────────
const mockEvent = {
    id: 1,
    title: "Clean Up Saigon River",
    description: "Together we clean the river",
    location: "District 1, HCMC",
    startDate: new Date("2026-08-01").toISOString(),
    endDate: new Date("2026-08-02").toISOString(),
    applicationDeadline: new Date("2026-07-15").toISOString(),
    maxCapacity: 50,
    approvedParticipants: 20,
    imageUrl: "https://cloudinary.com/img.jpg",
    status: "PUBLISHED",
    isActive: true,
    createdAt: new Date("2026-06-01").toISOString(),
    updatedAt: new Date("2026-06-15").toISOString(),
    category: { id: 5, name: "Môi trường", categoryType: "ENVIRONMENT" },
    createdByUser: { id: 10, fullName: "Admin User", avatarUrl: null },
};

const mockApplication = {
    id: 100,
    status: "Approved",
    createdAt: new Date("2026-07-01").toISOString(),
};

// ═══════════════════════════════════════════════════════════
//  Guest (unauthenticated)
// ═══════════════════════════════════════════════════════════
describe("GET /api/v1/events/:id — Guest", () => {
    it("should return 200 with full event detail for Guest", async () => {
        mockEventRepo.findByIdWithRelations.mockResolvedValue(mockEvent);

        const res = await request(app)
            .get("/api/v1/events/1")
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBe(1);
        expect(res.body.data.title).toBe("Clean Up Saigon River");
        expect(res.body.data.remainingSlots).toBe(30);
        expect(res.body.data.isFull).toBe(false);
        expect(res.body.data.maxCapacity).toBe(50);
        expect(res.body.data.approvedParticipants).toBe(20);
        expect(res.body.data.category).toEqual({
            id: 5,
            name: "Môi trường",
            categoryType: "ENVIRONMENT",
        });
        expect(res.body.data.createdBy).toEqual({
            id: 10,
            fullName: "Admin User",
            avatarUrl: null,
        });
        expect(res.body.data.userApplication).toBeNull();
    });
});

// ═══════════════════════════════════════════════════════════
//  Authenticated Volunteer
// ═══════════════════════════════════════════════════════════
describe("GET /api/v1/events/:id — Authenticated", () => {
    it("should return event detail with userApplication when user has applied", async () => {
        const { token, userId } = createAuthToken();
        mockEventRepo.findByIdWithRelations.mockResolvedValue(mockEvent);
        mockAppRepo.findByUserAndEvent.mockResolvedValue(mockApplication);

        const res = await request(app)
            .get("/api/v1/events/1")
            .set("Cookie", "token=" + token)
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.userApplication).toEqual({
            id: 100,
            status: "Approved",
            createdAt: mockApplication.createdAt,
        });
        expect(mockAppRepo.findByUserAndEvent).toHaveBeenCalledWith(userId, 1);
    });

    it("should return event detail with userApplication: null when user has no application", async () => {
        const { token } = createAuthToken();
        mockEventRepo.findByIdWithRelations.mockResolvedValue(mockEvent);
        mockAppRepo.findByUserAndEvent.mockResolvedValue(null);

        const res = await request(app)
            .get("/api/v1/events/1")
            .set("Cookie", "token=" + token)
            .expect(200);

        expect(res.body.data.userApplication).toBeNull();
    });
});

// ═══════════════════════════════════════════════════════════
//  Error cases
// ═══════════════════════════════════════════════════════════
describe("GET /api/v1/events/:id — Error Handling", () => {
    it("should return 400 when event id is not a positive integer", async () => {
        const res = await request(app)
            .get("/api/v1/events/abc")
            .expect(400);

        expect(res.body.success).toBe(false);
        expect(res.body.message).toBeDefined();
    });

    it("should return 404 when event does not exist", async () => {
        mockEventRepo.findByIdWithRelations.mockResolvedValue(null);

        const res = await request(app)
            .get("/api/v1/events/999")
            .expect(404);

        expect(res.body.success).toBe(false);
        expect(res.body.message).toBeDefined();
        expect(res.body.code).toBe("NOT_FOUND");
    });

    it("should return 400 when event id is zero", async () => {
        const res = await request(app)
            .get("/api/v1/events/0")
            .expect(400);

        expect(res.body.success).toBe(false);
    });

    it("should return 400 when event id is negative", async () => {
        const res = await request(app)
            .get("/api/v1/events/-5")
            .expect(400);

        expect(res.body.success).toBe(false);
    });
});