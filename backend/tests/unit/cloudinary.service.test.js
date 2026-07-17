/**
 * Unit Test: cloudinary.service.js (UC19)
 *
 * Owner: Member 1 - CuongLH
 * Module: Profile Management
 */

import { jest } from "@jest/globals";

const mockUploadStream = jest.fn();
const mockDestroy = jest.fn();

jest.unstable_mockModule("../../src/config/cloudinary.config.js", () => ({
  default: {
    uploader: {
      upload_stream: mockUploadStream,
      destroy: mockDestroy,
    },
  },
}));

const {
  uploadImage,
  deleteImage,
  extractPublicId,
} = await import("../../src/services/cloudinary.service.js");

describe("cloudinary.service — uploadImage", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should upload image successfully and return public_id + secure_url", async () => {
    const mockResult = {
      public_id: "avatars/abc123",
      secure_url: "https://res.cloudinary.com/demo/image/upload/v123/avatars/abc123.jpg",
    };

    mockUploadStream.mockImplementation((options, callback) => {
      callback(null, mockResult);
      return { end: jest.fn() };
    });

    const result = await uploadImage(Buffer.from("fake-image"), "avatars");
    expect(result.public_id).toBe("avatars/abc123");
    expect(result.secure_url).toBe("https://res.cloudinary.com/demo/image/upload/v123/avatars/abc123.jpg");
    expect(mockUploadStream).toHaveBeenCalledWith(
      { folder: "avatars", resource_type: "image" },
      expect.any(Function)
    );
  });

  it("should reject when Cloudinary upload fails", async () => {
    const mockError = new Error("Cloudinary API error");

    mockUploadStream.mockImplementation((options, callback) => {
      callback(mockError, null);
      return { end: jest.fn() };
    });

    await expect(uploadImage(Buffer.from("fake-image"), "avatars")).rejects.toThrow("Cloudinary API error");
  });
});

describe("cloudinary.service — deleteImage", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should delete image successfully", async () => {
    mockDestroy.mockResolvedValue({ result: "ok" });

    const result = await deleteImage("avatars/abc123");
    expect(result).toEqual({ result: "ok" });
    expect(mockDestroy).toHaveBeenCalledWith("avatars/abc123", { resource_type: "image" });
  });

  it("should not throw when deletion fails (logs warning)", async () => {
    mockDestroy.mockRejectedValue(new Error("Not found"));

    const result = await deleteImage("avatars/nonexistent");
    expect(result).toEqual({ result: "not found" });
  });
});

describe("cloudinary.service — extractPublicId", () => {
  it("should extract public_id from valid Cloudinary URL", () => {
    const url = "https://res.cloudinary.com/demo/image/upload/v1234567/avatars/abc123.jpg";
    const result = extractPublicId(url);
    expect(result).toBe("avatars/abc123");
  });

  it("should extract public_id from URL with nested folders", () => {
    const url = "https://res.cloudinary.com/demo/image/upload/v123/avatars/user/abc.jpg";
    const result = extractPublicId(url);
    expect(result).toBe("avatars/user/abc");
  });

  it("should extract public_id from URL without file extension", () => {
    const url = "https://res.cloudinary.com/demo/image/upload/v123/avatars/abc";
    const result = extractPublicId(url);
    expect(result).toBe("avatars/abc");
  });

  it("should return null for null or undefined input", () => {
    expect(extractPublicId(null)).toBeNull();
    expect(extractPublicId(undefined)).toBeNull();
    expect(extractPublicId("")).toBeNull();
  });

  it("should return null for invalid URL format", () => {
    expect(extractPublicId("not-a-url")).toBeNull();
    expect(extractPublicId("https://other-site.com/not/cloudinary")).toBeNull();
  });
});