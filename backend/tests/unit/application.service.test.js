/**
 * Unit Test: ApplicationService.cancelUserApplication() (UC14)
 *
 * Owner: Member 1 - CuongLH
 * Feature: Cancel Application
 */
import { jest } from "@jest/globals";

jest.unstable_mockModule("../../src/repositories/application.repository.js", () => ({
    default: {
        findByIdWithEvent: jest.fn(),
        cancelApplication: jest.fn(),
    },
}));

jest.unstable_mockModule("../../src/config/logger.config.js", () => ({
    default: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    },
}));

const appRepo = await import("../../src/repositories/application.repository.js");
const { findByIdWithEvent, cancelApplication } = appRepo.default;

// Mock Prisma transaction — returns whatever the callback returns
jest.unstable_mockModule("@prisma/client", () => {
    const original = jest.requireActual("@prisma/client");
    return {
        ...original,
        PrismaClient: jest.fn().mockImplementation(() => ({
            $transaction: jest.fn((cb) => cb({})),
        })),
    };
});

const { cancelUserApplication } = await import("../../src/services/application.service.js");

const futureDate = new Date("2026-12-31");
const pastDate = new Date("2025-01-01");

describe("ApplicationService.cancelUserApplication", () => {
    beforeEach(() => jest.clearAllMocks());

    // ─── TC01: Happy Path — PENDING → CANCELLED ───
    it("should cancel a PENDING application successfully", async () => {
        const cancelledApp = {
            id: 100,
            userId: 10,
            eventId: 5,
            status: "CANCELLED",
        };
        const mockApp = {
            id: 100,
            userId: 10,
            eventId: 5,
            status: "PENDING",
            event: { id: 5, status: "PUBLISHED", startDate: futureDate },
        };
        findByIdWithEvent.mockResolvedValue(mockApp);
        cancelApplication.mockResolvedValue(cancelledApp);

        const result = await cancelUserApplication(100, 10);

        expect(findByIdWithEvent).toHaveBeenCalledWith(100);
        expect(cancelApplication).toHaveBeenCalledWith(expect.anything(), 100);
        expect(result).toEqual(cancelledApp);
    });

    // ─── TC02: Happy Path — APPROVED → CANCELLED ───
    it("should cancel an APPROVED application when event is far in the future", async () => {
        const cancelledApp = {
            id: 102,
            userId: 10,
            eventId: 5,
            status: "CANCELLED",
        };
        const mockApp = {
            id: 102,
            userId: 10,
            eventId: 5,
            status: "APPROVED",
            event: { id: 5, status: "PUBLISHED", startDate: futureDate },
        };
        findByIdWithEvent.mockResolvedValue(mockApp);
        cancelApplication.mockResolvedValue(cancelledApp);

        const result = await cancelUserApplication(102, 10);

        expect(result).toEqual(cancelledApp);
    });

    // ─── TC03: 404 — Application not found ───
    it("should throw NOT_FOUND if application does not exist", async () => {
        findByIdWithEvent.mockResolvedValue(null);

        await expect(cancelUserApplication(999, 10)).rejects.toMatchObject({
            statusCode: 404,
            code: "NOT_FOUND",
        });
        expect(cancelApplication).not.toHaveBeenCalled();
    });

    // ─── TC04: 403 — User is not the owner ───
    it("should throw FORBIDDEN if user is not the owner", async () => {
        const mockApp = {
            id: 100,
            userId: 99,
            eventId: 5,
            status: "PENDING",
            event: { id: 5, status: "PUBLISHED", startDate: futureDate },
        };
        findByIdWithEvent.mockResolvedValue(mockApp);

        await expect(cancelUserApplication(100, 10)).rejects.toMatchObject({
            statusCode: 403,
            code: "FORBIDDEN",
        });
        expect(cancelApplication).not.toHaveBeenCalled();
    });

    // ─── TC05: 409 — Already CANCELLED ───
    it("should throw CONFLICT if application is already CANCELLED", async () => {
        const mockApp = {
            id: 100,
            userId: 10,
            eventId: 5,
            status: "CANCELLED",
            event: { id: 5, status: "PUBLISHED", startDate: futureDate },
        };
        findByIdWithEvent.mockResolvedValue(mockApp);

        await expect(cancelUserApplication(100, 10)).rejects.toMatchObject({
            statusCode: 409,
            code: "CONFLICT",
        });
        expect(cancelApplication).not.toHaveBeenCalled();
    });

    // ─── TC06: 409 — Already REJECTED ───
    it("should throw CONFLICT if application is REJECTED", async () => {
        const mockApp = {
            id: 100,
            userId: 10,
            eventId: 5,
            status: "REJECTED",
            event: { id: 5, status: "PUBLISHED", startDate: futureDate },
        };
        findByIdWithEvent.mockResolvedValue(mockApp);

        await expect(cancelUserApplication(100, 10)).rejects.toMatchObject({
            statusCode: 409,
            code: "CONFLICT",
        });
        expect(cancelApplication).not.toHaveBeenCalled();
    });

    // ─── TC07: 409 — Event is not PUBLISHED (e.g. IN_PROGRESS) ───
    it("should throw CONFLICT if event is not PUBLISHED", async () => {
        const mockApp = {
            id: 100,
            userId: 10,
            eventId: 5,
            status: "PENDING",
            event: { id: 5, status: "IN_PROGRESS", startDate: pastDate },
        };
        findByIdWithEvent.mockResolvedValue(mockApp);

        await expect(cancelUserApplication(100, 10)).rejects.toMatchObject({
            statusCode: 409,
            code: "CONFLICT",
        });
        expect(cancelApplication).not.toHaveBeenCalled();
    });

    // ─── TC08: 409 — Event is COMPLETED ───
    it("should throw CONFLICT if event is COMPLETED", async () => {
        const mockApp = {
            id: 100,
            userId: 10,
            eventId: 5,
            status: "APPROVED",
            event: { id: 5, status: "COMPLETED", startDate: pastDate },
        };
        findByIdWithEvent.mockResolvedValue(mockApp);

        await expect(cancelUserApplication(100, 10)).rejects.toMatchObject({
            statusCode: 409,
            code: "CONFLICT",
        });
        expect(cancelApplication).not.toHaveBeenCalled();
    });

    // ─── TC09: 409 — Event started (PUBLISHED but startDate has passed) ───
    it("should throw CONFLICT if event start date has passed", async () => {
        const yesterday = new Date(Date.now() - 86400000);
        const mockApp = {
            id: 100,
            userId: 10,
            eventId: 5,
            status: "PENDING",
            event: { id: 5, status: "PUBLISHED", startDate: yesterday },
        };
        findByIdWithEvent.mockResolvedValue(mockApp);

        await expect(cancelUserApplication(100, 10)).rejects.toMatchObject({
            statusCode: 409,
            code: "CONFLICT",
        });
        expect(cancelApplication).not.toHaveBeenCalled();
    });
});