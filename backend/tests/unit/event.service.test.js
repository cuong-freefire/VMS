/**
 * Unit Test: EventService.getEventDetail() (UC09)
 *
 * Owner: Member 1 - CuongLH
 * Module: Event Management
 */

import { jest } from "@jest/globals";

jest.unstable_mockModule("../../src/repositories/event.repository.js", () => ({
  default: {
    findByIdWithRelations: jest.fn(),
  },
}));

jest.unstable_mockModule("../../src/repositories/application.repository.js", () => ({
  default: {
    findByUserAndEvent: jest.fn(),
  },
}));

jest.unstable_mockModule("../../src/config/logger.config.js", () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

const eventRepo = await import("../../src/repositories/event.repository.js");
const { findByIdWithRelations } = eventRepo.default;

const applicationRepo = await import("../../src/repositories/application.repository.js");
const { findByUserAndEvent } = applicationRepo.default;

const { getEventDetail } = await import("../../src/services/event.service.js");

describe("EventService.getEventDetail", () => {
  beforeEach(() => jest.clearAllMocks());

  const mockEvent = {
    id: 1,
    title: "Clean Up Saigon River",
    description: "Together we clean",
    location: "District 1",
    startDate: new Date("2026-08-01"),
    endDate: new Date("2026-08-02"),
    applicationDeadline: new Date("2026-07-15"),
    maxCapacity: 50,
    approvedParticipants: 20,
    imageUrl: "https://cloudinary.com/img.jpg",
    status: "PUBLISHED",
    isActive: true,
    createdAt: new Date("2026-06-01"),
    updatedAt: new Date("2026-06-15"),
    category: {
      id: 5,
      name: "Môi trường",
      categoryType: "ENVIRONMENT",
    },
    createdByUser: {
      id: 10,
      fullName: "Admin User",
      avatarUrl: null,
    },
  };

  const mockApplication = {
    id: 100,
    status: "Approved",
    createdAt: new Date("2026-07-01"),
  };

  it("should return event detail without userApplication when userId is null", async () => {
    findByIdWithRelations.mockResolvedValue(mockEvent);

    const result = await getEventDetail(1, null);

    expect(result.id).toBe(1);
    expect(result.title).toBe("Clean Up Saigon River");
    expect(result.remainingSlots).toBe(30);
    expect(result.isFull).toBe(false);
    expect(result.maxCapacity).toBe(50);
    expect(result.approvedParticipants).toBe(20);
    expect(result.category).toEqual({
      id: 5,
      name: "Môi trường",
      categoryType: "ENVIRONMENT",
    });
    expect(result.createdBy).toEqual({
      id: 10,
      fullName: "Admin User",
      avatarUrl: null,
    });
    expect(result.userApplication).toBeNull();
    expect(findByIdWithRelations).toHaveBeenCalledWith(1);
    expect(findByUserAndEvent).not.toHaveBeenCalled();
  });

  it("should return event detail with userApplication when user has applied", async () => {
    findByIdWithRelations.mockResolvedValue(mockEvent);
    findByUserAndEvent.mockResolvedValue(mockApplication);

    const result = await getEventDetail(1, 5);

    expect(result.userApplication).toEqual({
      id: 100,
      status: "Approved",
      createdAt: mockApplication.createdAt,
    });
    expect(findByUserAndEvent).toHaveBeenCalledWith(5, 1);
  });

  it("should return event detail with null userApplication when user has not applied", async () => {
    findByIdWithRelations.mockResolvedValue(mockEvent);
    findByUserAndEvent.mockResolvedValue(null);

    const result = await getEventDetail(1, 5);

    expect(result.userApplication).toBeNull();
    expect(findByUserAndEvent).toHaveBeenCalledWith(5, 1);
  });

  it("should throw error when event does not exist", async () => {
    findByIdWithRelations.mockResolvedValue(null);

    await expect(getEventDetail(999, null)).rejects.toThrow(
      "Không tìm thấy sự kiện."
    );
  });

  it("should correctly compute isFull = true when remainingSlots = 0", async () => {
    findByIdWithRelations.mockResolvedValue({
      ...mockEvent,
      maxCapacity: 50,
      approvedParticipants: 50,
    });

    const result = await getEventDetail(1, null);

    expect(result.remainingSlots).toBe(0);
    expect(result.isFull).toBe(true);
  });

  it("should correctly compute isFull = false when remainingSlots > 0", async () => {
    findByIdWithRelations.mockResolvedValue({
      ...mockEvent,
      maxCapacity: 200,
      approvedParticipants: 1,
    });

    const result = await getEventDetail(1, null);

    expect(result.remainingSlots).toBe(199);
    expect(result.isFull).toBe(false);
  });

  it("should return event detail without category when category is null", async () => {
    findByIdWithRelations.mockResolvedValue({
      ...mockEvent,
      category: null,
    });

    const result = await getEventDetail(1, null);

    expect(result.category).toBeNull();
  });

  it("should return event detail without createdBy when createdByUser is null", async () => {
    findByIdWithRelations.mockResolvedValue({
      ...mockEvent,
      createdByUser: null,
    });

    const result = await getEventDetail(1, null);

    expect(result.createdBy).toBeNull();
  });

  it("should not fataly fail when findByUserAndEvent throws an error", async () => {
    findByIdWithRelations.mockResolvedValue(mockEvent);
    findByUserAndEvent.mockRejectedValue(new Error("DB error"));

    const result = await getEventDetail(1, 5);

    expect(result.userApplication).toBeNull();
  });
});