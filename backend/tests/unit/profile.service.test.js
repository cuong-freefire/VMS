import { jest } from "@jest/globals";
import { ServiceError } from "../../src/utils/response.util.js";

jest.unstable_mockModule("../../src/repositories/profile.repository.js", () => ({
  findUserWithSkills: jest.fn(),
}));

const repoMod = await import("../../src/repositories/profile.repository.js");
const svcMod = await import("../../src/services/profile.service.js");
const mockFindUserWithSkills = repoMod.findUserWithSkills;
const { getUserProfile } = svcMod;

const mockUser = {
  id: 1, fullName: "Nguyen Van A", email: "user@example.com",
  phone: "0123456789", avatarUrl: "https://img.com/avatar.jpg",
  isActive: true,
  userSkills: [
    { skill: { id: 1, name: "Giao tiep" } },
    { skill: { id: 3, name: "Tieng Anh" } },
  ],
};

describe("getUserProfile", () => {
  beforeEach(() => jest.clearAllMocks());

  it("US1: returns profile with skills on happy path", async () => {
    mockFindUserWithSkills.mockResolvedValue(mockUser);
    const r = await getUserProfile(1);
    expect(r).toEqual({
      full_name: "Nguyen Van A", email: "user@example.com",
      phone_number: "0123456789", avatar_url: "https://img.com/avatar.jpg",
      skills: [{ skill_id: 1, skill_name: "Giao tiep" }, { skill_id: 3, skill_name: "Tieng Anh" }],
    });
  });

  it("US1: calls repo with correct userId", async () => {
    mockFindUserWithSkills.mockResolvedValue(mockUser);
    await getUserProfile(42);
    expect(mockFindUserWithSkills).toHaveBeenCalledWith(42);
  });

  it("US1: phone_number null when not set", async () => {
    mockFindUserWithSkills.mockResolvedValue({ ...mockUser, phone: null });
    const r = await getUserProfile(1);
    expect(r.phone_number).toBeNull();
  });

  it("US1: SC-003 no sensitive data leakage", async () => {
    mockFindUserWithSkills.mockResolvedValue(mockUser);
    const r = await getUserProfile(1);
    ["id","password_hash","passwordHash","role_id","is_active","isActive"].forEach(f => expect(r).not.toHaveProperty(f));
  });

  it("US3: throws USER_NOT_FOUND when user null", async () => {
    mockFindUserWithSkills.mockResolvedValue(null);
    try { await getUserProfile(999); fail("should throw"); }
    catch (e) { expect(e.status).toBe(404); expect(e.code).toBe("USER_NOT_FOUND"); }
  });

  it("US3: throws ACCOUNT_DISABLED when isActive=false", async () => {
    mockFindUserWithSkills.mockResolvedValue({ ...mockUser, isActive: false });
    try { await getUserProfile(1); fail("should throw"); }
    catch (e) { expect(e.status).toBe(403); expect(e.code).toBe("ACCOUNT_DISABLED"); }
  });

  it("US4: returns empty skills array (SC-004)", async () => {
    mockFindUserWithSkills.mockResolvedValue({ ...mockUser, userSkills: [] });
    const r = await getUserProfile(1);
    expect(r.skills).toEqual([]);
    expect(Array.isArray(r.skills)).toBe(true);
  });

  it("throws INTERNAL_SERVER_ERROR on DB error", async () => {
    mockFindUserWithSkills.mockRejectedValue(new Error("DB down"));
    try { await getUserProfile(1); fail("should throw"); }
    catch (e) { expect(e.status).toBe(500); expect(e.code).toBe("INTERNAL_SERVER_ERROR"); }
  });

  it("re-throws ServiceError without wrapping", async () => {
    const orig = new ServiceError("custom", 418, "CUSTOM");
    mockFindUserWithSkills.mockRejectedValue(orig);
    try { await getUserProfile(1); fail("should throw"); }
    catch (e) { expect(e).toBe(orig); expect(e.status).toBe(418); }
  });
});