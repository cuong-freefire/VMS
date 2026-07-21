/**
 * Integration Tests: UC14 - Cancel Application
 *
 * Tests cover:
 *  - PENDING application → 200 cancelled
 *  - APPROVED application → 200 cancelled
 *  - No auth → 401
 *  - Expired token → 401
 *  - Wrong owner → 403
 *  - Non-existent application → 404
 *  - Invalid ID param → 400
 *  - REJECTED application → 409
 *  - Already CANCELLED → 409
 *  - Event started → 409
 *  - Event COMPLETED → 409
 *  - Event CANCELLED → 409
 *
 * Owner: Member 1 - CuongLH
 * Feature: UC14 — Cancel Application
 */

import { jest, beforeAll, afterAll, beforeEach, describe, it, expect } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";

process.env.SECRET_KEY = "test-secret-key";
process.env.NODE_ENV = "test";

let app;
let mockAppRepo;
let mockAuthRepo;

const FUTURE_DATE = new Date("2026-12-31T00:00:00.000Z");
const PAST_DATE = new Date("2025-01-01T00:00:00.000Z");
const YESTERDAY = new Date(Date.now() - 86400000);

beforeAll(async () => {
    // ────────── Mock application.repository.js ──────────
    mockAppRepo = {
        findByUserAndEvent: jest.fn(),
        findByIdWithEvent: jest.fn(),
        cancelApplication: jest.fn(),
    };

    await jest.unstable_mockModule("../../src/repositories/application.repository.js", () => ({
        default: mockAppRepo,
    }));

    // ────────── Mock auth.repository.js ──────────
    mockAuthRepo = {
        getJtiByUserId: jest.fn(),
        findUserByEmail: jest.fn(),
    };

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
 * Returns { token, userId }.
 */
function createAuthToken(userId = 10, email = "volunteer@vms-test.com") {
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

/**
 * Helper: Set up a valid PENDING application with PUBLISHED future event.
 */
function mockValidPendingApplication(id = 100, userId = 10) {
    const mockApp = {
        id,
        userId,
        eventId: 5,
        status: "PENDING",
        event: { id: 5, status: "PUBLISHED", startDate: FUTURE_DATE },
    };
    mockAppRepo.findByIdWithEvent.mockResolvedValue(mockApp);
}

/**
 * Helper: Set up a valid APPROVED application with PUBLISHED future event.
 */
function mockValidApprovedApplication(id = 100, userId = 10) {
    const mockApp = {
        id,
        userId,
        eventId: 5,
        status: "APPROVED",
        event: { id: 5, status: "PUBLISHED", startDate: FUTURE_DATE },
    };
    mockAppRepo.findByIdWithEvent.mockResolvedValue(mockApp);
}

// =============================================================================
//  200 — Happy Path
// =============================================================================

describe("PATCH /api/v1/applications/:id/cancel — Happy Path", () => {
    it("should cancel a PENDING application (200)", async () => {
        const { token } = createAuthToken(10);
        mockValidPendingApplication(100, 10);
        mockAppRepo.cancelApplication.mockResolvedValue({
            id: 100,
            userId: 10,
            eventId: 5,
            status: "CANCELLED",
        });

        const res = await request(app)
            .patch("/api/v1/applications/100/cancel")
            .set("Cookie", `token=${token}`)
            .set("Accept", "application/json");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.status).toBe("CANCELLED");
        expect(mockAppRepo.findByIdWithEvent).toHaveBeenCalledWith(100);
        expect(mockAppRepo.cancelApplication).toHaveBeenCalled();
    });

    it("should cancel an APPROVED application (200)", async () => {
        const { token } = createAuthToken(10);
        mockValidApprovedApplication(102, 10);
        mockAppRepo.cancelApplication.mockResolvedValue({
            id: 102,
            userId: 10,
            eventId: 5,
            status: "CANCELLED",
        });

        const res = await request(app)
            .patch("/api/v1/applications/102/cancel")
            .set("Cookie", `token=${token}`)
            .set("Accept", "application/json");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.status).toBe("CANCELLED");
    });
});

// =============================================================================
//  401 — Unauthorized
// =============================================================================

describe("PATCH /api/v1/applications/:id/cancel — Unauthorized", () => {
    it("should return 401 when no auth cookie is present", async () => {
        const res = await request(app)
            .patch("/api/v1/applications/100/cancel")
            .set("Accept", "application/json");

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });

    it("should return 401 when token is expired", async () => {
        const jti = "99-expired-" + Date.now();
        const token = jwt.sign(
            { user_id: 10, email: "expired@vms-test.com", role_id: 2, jti },
            process.env.SECRET_KEY,
            { expiresIn: "-1s" } // already expired
        );
        mockAuthRepo.getJtiByUserId.mockResolvedValue({
            jti,
            expiresAt: new Date(Date.now() - 3600000), // expired in the past
        });
        mockAuthRepo.findUserByEmail.mockResolvedValue({
            id: 10,
            email: "expired@vms-test.com",
            isActive: true,
            emailVerified: true,
        });

        const res = await request(app)
            .patch("/api/v1/applications/100/cancel")
            .set("Cookie", `token=${token}`)
            .set("Accept", "application/json");

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });
});

// =============================================================================
//  403 — Forbidden (wrong owner)
// =============================================================================

describe("PATCH /api/v1/applications/:id/cancel — Forbidden", () => {
    it("should return 403 when user tries to cancel another user's application", async () => {
        const { token } = createAuthToken(10); // logged in as userId=10
        // Application belongs to userId=99
        mockAppRepo.findByIdWithEvent.mockResolvedValue({
            id: 100,
            userId: 99,
            eventId: 5,
            status: "PENDING",
            event: { id: 5, status: "PUBLISHED", startDate: FUTURE_DATE },
        });

        const res = await request(app)
            .patch("/api/v1/applications/100/cancel")
            .set("Cookie", `token=${token}`)
            .set("Accept", "application/json");

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.code).toBe("FORBIDDEN");
        expect(mockAppRepo.cancelApplication).not.toHaveBeenCalled();
    });
});

// =============================================================================
//  404 — Not Found
// =============================================================================

describe("PATCH /api/v1/applications/:id/cancel — Not Found", () => {
    it("should return 404 when application does not exist", async () => {
        const { token } = createAuthToken(10);
        mockAppRepo.findByIdWithEvent.mockResolvedValue(null);

        const res = await request(app)
            .patch("/api/v1/applications/99999/cancel")
            .set("Cookie", `token=${token}`)
            .set("Accept", "application/json");

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.body.code).toBe("NOT_FOUND");
    });
});

// =============================================================================
//  400 — Validation Error (invalid param)
// =============================================================================

describe("PATCH /api/v1/applications/:id/cancel — Validation Error", () => {
    it("should return 400 when id is not a valid integer", async () => {
        const { token } = createAuthToken(10);

        const res = await request(app)
            .patch("/api/v1/applications/abc/cancel")
            .set("Cookie", `token=${token}`)
            .set("Accept", "application/json");

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("should return 400 when id is zero", async () => {
        const { token } = createAuthToken(10);

        const res = await request(app)
            .patch("/api/v1/applications/0/cancel")
            .set("Cookie", `token=${token}`)
            .set("Accept", "application/json");

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it("should return 400 when id is negative", async () => {
        const { token } = createAuthToken(10);

        const res = await request(app)
            .patch("/api/v1/applications/-5/cancel")
            .set("Cookie", `token=${token}`)
            .set("Accept", "application/json");

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });
});

// =============================================================================
//  409 — Conflict (business rule violations)
// =============================================================================

describe("PATCH /api/v1/applications/:id/cancel — Conflict", () => {
    it("should return 409 when application is already CANCELLED", async () => {
        const { token } = createAuthToken(10);
        mockAppRepo.findByIdWithEvent.mockResolvedValue({
            id: 100,
            userId: 10,
            eventId: 5,
            status: "CANCELLED",
            event: { id: 5, status: "PUBLISHED", startDate: FUTURE_DATE },
        });

        const res = await request(app)
            .patch("/api/v1/applications/100/cancel")
            .set("Cookie", `token=${token}`)
            .set("Accept", "application/json");

        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
        expect(res.body.code).toBe("CONFLICT");
        expect(mockAppRepo.cancelApplication).not.toHaveBeenCalled();
    });

    it("should return 409 when application is REJECTED", async () => {
        const { token } = createAuthToken(10);
        mockAppRepo.findByIdWithEvent.mockResolvedValue({
            id: 100,
            userId: 10,
            eventId: 5,
            status: "REJECTED",
            event: { id: 5, status: "PUBLISHED", startDate: FUTURE_DATE },
        });

        const res = await request(app)
            .patch("/api/v1/applications/100/cancel")
            .set("Cookie", `token=${token}`)
            .set("Accept", "application/json");

        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
        expect(res.body.code).toBe("CONFLICT");
    });

    it("should return 409 when event has already started", async () => {
        const { token } = createAuthToken(10);
        mockAppRepo.findByIdWithEvent.mockResolvedValue({
            id: 100,
            userId: 10,
            eventId: 5,
            status: "PENDING",
            event: { id: 5, status: "PUBLISHED", startDate: YESTERDAY },
        });

        const res = await request(app)
            .patch("/api/v1/applications/100/cancel")
            .set("Cookie", `token=${token}`)
            .set("Accept", "application/json");

        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
        expect(res.body.code).toBe("CONFLICT");
    });

    it("should return 409 when event is COMPLETED", async () => {
        const { token } = createAuthToken(10);
        mockAppRepo.findByIdWithEvent.mockResolvedValue({
            id: 100,
            userId: 10,
            eventId: 5,
            status: "APPROVED",
            event: { id: 5, status: "COMPLETED", startDate: PAST_DATE },
        });

        const res = await request(app)
            .patch("/api/v1/applications/100/cancel")
            .set("Cookie", `token=${token}`)
            .set("Accept", "application/json");

        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
        expect(res.body.code).toBe("CONFLICT");
    });

    it("should return 409 when event is CANCELLED (by organizer)", async () => {
        const { token } = createAuthToken(10);
        mockAppRepo.findByIdWithEvent.mockResolvedValue({
            id: 100,
            userId: 10,
            eventId: 5,
            status: "PENDING",
            event: { id: 5, status: "CANCELLED", startDate: FUTURE_DATE },
        });

        const res = await request(app)
            .patch("/api/v1/applications/100/cancel")
            .set("Cookie", `token=${token}`)
            .set("Accept", "application/json");

        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
        expect(res.body.code).toBe("CONFLICT");
    });

    it("should return 409 when event is IN_PROGRESS", async () => {
        const { token } = createAuthToken(10);
        mockAppRepo.findByIdWithEvent.mockResolvedValue({
            id: 100,
            userId: 10,
            eventId: 5,
            status: "PENDING",
            event: { id: 5, status: "IN_PROGRESS", startDate: PAST_DATE },
        });

        const res = await request(app)
            .patch("/api/v1/applications/100/cancel")
            .set("Cookie", `token=${token}`)
            .set("Accept", "application/json");

        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
        expect(res.body.code).toBe("CONFLICT");
    });
});