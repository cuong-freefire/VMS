/**
 * Unit Test: ProfileService.updateProfile() (UC19)
 *
 * Owner: Member 1 - CuongLH
 * Module: Profile Management
 */

import { jest } from "@jest/globals";

jest.unstable_mockModule("../../src/repositories/profile.repository.js", () => ({
  findUserWithSkills: jest.fn(),
  updateUser: jest.fn(),
}));

jest.unstable_mockModule("../../src/services/cloudinary.service.js", () => ({
  uploadImage: jest.fn(),
  deleteImage: jest.fn(),
  extractPublicId: jest.fn(),
}));

const { findUserWithSkills, updateUser } = await import("../../src/repositories/profile.repository.js");
const { updateProfile } = await import("../../src/services/profile.service.js");

const mockUser = {
  id: 1,
  fullName: "Nguyễn Văn A",
  email: "user@example.com",
  phone: "0901234567",
  avatarUrl: null,
  isActive: true,
  userSkills: [{ skill: { id: 1, name: "Giao tiếp" } }],
};

const mockUpdatedUser = {
  ...mockUser,
  fullName: "Nguyễn Văn B",
  phone: "0987654321",
};

describe("ProfileService.updateProfile", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should update full_name only", async () => {
    findUserWithSkills.mockResolvedValue(mockUser);
    updateUser.mockResolvedValue({ ...mockUpdatedUser, phone: "0901234567" });

    const result = await updateProfile(1, { full_name: "Nguyễn Văn B" }, undefined);
    expect(result.full_name).toBe("Nguyễn Văn B");
    expect(updateUser).toHaveBeenCalledWith(1, { fullName: "Nguyễn Văn B" });
  });

  it("should update phone_number only (map to phone)", async () => {
    findUserWithSkills.mockResolvedValue(mockUser);
    updateUser.mockResolvedValue(mockUpdatedUser);

    const result = await updateProfile(1, { phone_number: "0987654321" }, undefined);
    expect(result.phone_number).toBe("0987654321");
    expect(updateUser).toHaveBeenCalledWith(1, { phone: "0987654321" });
  });

  it("should update both full_name and phone_number", async () => {
    findUserWithSkills.mockResolvedValue(mockUser);
    updateUser.mockResolvedValue(mockUpdatedUser);

    const result = await updateProfile(1, { full_name: "Nguyễn Văn B", phone_number: "0987654321" }, undefined);
    expect(result.full_name).toBe("Nguyễn Văn B");
    expect(result.phone_number).toBe("0987654321");
    expect(updateUser).toHaveBeenCalledWith(1, { fullName: "Nguyễn Văn B", phone: "0987654321" });
  });

  it("should throw USER_NOT_FOUND when user does not exist", async () => {
    findUserWithSkills.mockResolvedValue(null);
    await expect(updateProfile(999, {}, undefined)).rejects.toThrow("Tài khoản không tồn tại");
  });

  it("should throw ACCOUNT_DISABLED when user is inactive", async () => {
    findUserWithSkills.mockResolvedValue({ ...mockUser, isActive: false });
    await expect(updateProfile(1, {}, undefined)).rejects.toThrow("Tài khoản đã bị vô hiệu hóa");
  });

  it("should accept empty body (no changes)", async () => {
    findUserWithSkills.mockResolvedValue(mockUser);
    updateUser.mockResolvedValue(mockUser);

    const result = await updateProfile(1, {}, undefined);
    expect(result.full_name).toBe("Nguyễn Văn A");
    expect(updateUser).toHaveBeenCalledWith(1, {});
  });
});
