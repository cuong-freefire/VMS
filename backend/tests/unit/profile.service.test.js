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
  createdAt: new Date('2025-01-01'),
  role: { name: 'VOLUNTEER' },
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

const { uploadImage, deleteImage, extractPublicId } = await import("../../src/services/cloudinary.service.js");

const mockFile = { buffer: Buffer.from("fake-image-data"), originalname: "test.jpg" };

const mockUserWithAvatar = {
  ...mockUser,
  avatarUrl: "https://res.cloudinary.com/demo/image/upload/v123/avatars/old123.jpg",
};

const mockUserWithAvatarUpdated = {
  ...mockUserWithAvatar,
  fullName: "Nguyễn Văn B",
  avatarUrl: "https://res.cloudinary.com/demo/image/upload/v456/avatars/new456.jpg",
};

// ─── US2: Image Upload Tests (T015) ───

describe("ProfileService.updateProfile — Image Upload (US2)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should upload new avatar when user has no existing avatar", async () => {
    findUserWithSkills.mockResolvedValue(mockUser);
    uploadImage.mockResolvedValue({
      public_id: "avatars/new456",
      secure_url: "https://res.cloudinary.com/demo/image/upload/v456/avatars/new456.jpg",
    });
    updateUser.mockResolvedValue({
      ...mockUser,
      avatarUrl: "https://res.cloudinary.com/demo/image/upload/v456/avatars/new456.jpg",
    });

    const result = await updateProfile(1, {}, mockFile);

    expect(deleteImage).not.toHaveBeenCalled();
    expect(uploadImage).toHaveBeenCalledWith(mockFile.buffer, "avatars");
    expect(result.avatar_url).toBe("https://res.cloudinary.com/demo/image/upload/v456/avatars/new456.jpg");
  });

  it("should delete old avatar and upload new one when user already has avatar", async () => {
    findUserWithSkills.mockResolvedValue(mockUserWithAvatar);
    extractPublicId.mockReturnValue("avatars/old123");
    deleteImage.mockResolvedValue({ result: "ok" });
    uploadImage.mockResolvedValue({
      public_id: "avatars/new456",
      secure_url: "https://res.cloudinary.com/demo/image/upload/v456/avatars/new456.jpg",
    });
    updateUser.mockResolvedValue(mockUserWithAvatarUpdated);

    const result = await updateProfile(1, { full_name: "Nguyễn Văn B" }, mockFile);

    expect(extractPublicId).toHaveBeenCalledWith("https://res.cloudinary.com/demo/image/upload/v123/avatars/old123.jpg");
    expect(deleteImage).toHaveBeenCalledWith("avatars/old123");
    expect(uploadImage).toHaveBeenCalledWith(mockFile.buffer, "avatars");
    expect(result.avatar_url).toBe("https://res.cloudinary.com/demo/image/upload/v456/avatars/new456.jpg");
    expect(result.full_name).toBe("Nguyễn Văn B");
    expect(updateUser).toHaveBeenCalledWith(1, {
      fullName: "Nguyễn Văn B",
      avatarUrl: "https://res.cloudinary.com/demo/image/upload/v456/avatars/new456.jpg",
    });
  });

  it("should not update DB when Cloudinary upload fails", async () => {
    findUserWithSkills.mockResolvedValue(mockUser);
    uploadImage.mockRejectedValue(new Error("Network error"));

    await expect(updateProfile(1, {}, mockFile)).rejects.toThrow("Không thể tải ảnh lên");
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("should still succeed when Cloudinary delete of old image fails", async () => {
    findUserWithSkills.mockResolvedValue(mockUserWithAvatar);
    extractPublicId.mockReturnValue("avatars/old123");
    deleteImage.mockResolvedValue({ result: "not found" });
    uploadImage.mockResolvedValue({
      public_id: "avatars/new456",
      secure_url: "https://res.cloudinary.com/demo/image/upload/v456/avatars/new456.jpg",
    });
    updateUser.mockResolvedValue(mockUserWithAvatarUpdated);

    const result = await updateProfile(1, { full_name: "Nguyễn Văn B" }, mockFile);

    expect(deleteImage).toHaveBeenCalled();
    expect(uploadImage).toHaveBeenCalled();
    expect(result.avatar_url).toBe("https://res.cloudinary.com/demo/image/upload/v456/avatars/new456.jpg");
  });
});

// ─── US3: Combined Update Tests (T020) ───

describe("ProfileService.updateProfile — Combined Update (US3)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should update full_name + phone_number + avatar simultaneously", async () => {
    findUserWithSkills.mockResolvedValue(mockUserWithAvatar);
    extractPublicId.mockReturnValue("avatars/old123");
    deleteImage.mockResolvedValue({ result: "ok" });
    uploadImage.mockResolvedValue({
      public_id: "avatars/new456",
      secure_url: "https://res.cloudinary.com/demo/image/upload/v456/avatars/new456.jpg",
    });
    updateUser.mockResolvedValue({
      ...mockUserWithAvatar,
      fullName: "Nguyễn Văn C",
      phone: "0911111111",
      avatarUrl: "https://res.cloudinary.com/demo/image/upload/v456/avatars/new456.jpg",
    });

    const result = await updateProfile(
      1,
      { full_name: "Nguyễn Văn C", phone_number: "0911111111" },
      mockFile
    );

    expect(result.full_name).toBe("Nguyễn Văn C");
    expect(result.phone_number).toBe("0911111111");
    expect(result.avatar_url).toBe("https://res.cloudinary.com/demo/image/upload/v456/avatars/new456.jpg");
    expect(updateUser).toHaveBeenCalledWith(1, {
      fullName: "Nguyễn Văn C",
      phone: "0911111111",
      avatarUrl: "https://res.cloudinary.com/demo/image/upload/v456/avatars/new456.jpg",
    });
  });

  it("should not update DB when combined update fails at Cloudinary upload", async () => {
    findUserWithSkills.mockResolvedValue(mockUserWithAvatar);
    extractPublicId.mockReturnValue("avatars/old123");
    deleteImage.mockResolvedValue({ result: "ok" });
    uploadImage.mockRejectedValue(new Error("Upload failed"));

    await expect(
      updateProfile(1, { full_name: "Nguyễn Văn C" }, mockFile)
    ).rejects.toThrow("Không thể tải ảnh lên");

    expect(updateUser).not.toHaveBeenCalled();
  });
});