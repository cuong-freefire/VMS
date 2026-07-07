import { jest } from "@jest/globals";

const mockFindUnique = jest.fn();
jest.unstable_mockModule("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: { findUnique: mockFindUnique },
  })),
}));

const repoMod = await import("../../src/repositories/profile.repository.js");
const { findUserWithSkills } = repoMod;

describe("findUserWithSkills", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should call prisma.user.findUnique with correct userId", async () => {
    mockFindUnique.mockResolvedValue({ id: 1, fullName: "Test", isActive: true });
    await findUserWithSkills(1);
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: expect.objectContaining({
        id: true, fullName: true, email: true, phone: true,
        avatarUrl: true, isActive: true, userSkills: expect.any(Object),
      }),
    });
  });

  it("should filter skills by isActive=true", async () => {
    mockFindUnique.mockResolvedValue({ id: 1, userSkills: [] });
    await findUserWithSkills(1);
    const call = mockFindUnique.mock.calls[0][0];
    expect(call.select.userSkills.where.skill.isActive).toBe(true);
  });

  it("should return null when user not found", async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await findUserWithSkills(999);
    expect(result).toBeNull();
  });

  it("should NOT select password_hash or role_id", async () => {
    mockFindUnique.mockResolvedValue({ id: 1 });
    await findUserWithSkills(1);
    const sel = mockFindUnique.mock.calls[0][0].select;
    expect(sel.passwordHash).toBeUndefined();
    expect(sel.roleId).toBeUndefined();
  });
});