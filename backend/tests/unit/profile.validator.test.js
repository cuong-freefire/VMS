/**
 * Unit Test: profile.validator.js — updateProfileSchema (UC19)
 *
 * Owner: Member 1 - CuongLH
 * Module: Profile Management
 */

import { updateProfileSchema } from "../../src/middlewares/validators/profile.validator.js";

describe("updateProfileSchema", () => {
  describe("full_name validation", () => {
    it("should accept valid full_name (>= 2 ký tự)", () => {
      const result = updateProfileSchema.safeParse({ full_name: "Nguyễn Văn A" });
      expect(result.success).toBe(true);
      expect(result.data.full_name).toBe("Nguyễn Văn A");
    });

    it("should reject full_name quá ngắn (< 2 ký tự)", () => {
      const result = updateProfileSchema.safeParse({ full_name: "A" });
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("ít nhất 2 ký tự");
    });

    it("should accept empty body (full_name optional)", () => {
      const result = updateProfileSchema.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
    });
  });

  describe("phone_number validation", () => {
    it("should accept valid phone_number (10 chữ số bắt đầu bằng 0)", () => {
      const result = updateProfileSchema.safeParse({ phone_number: "0987654321" });
      expect(result.success).toBe(true);
      expect(result.data.phone_number).toBe("0987654321");
    });

    it("should accept valid phone_number (11 chữ số)", () => {
      const result = updateProfileSchema.safeParse({ phone_number: "09876543210" });
      expect(result.success).toBe(true);
    });

    it("should reject phone_number sai định dạng", () => {
      const result = updateProfileSchema.safeParse({ phone_number: "123" });
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("Số điện thoại");
    });

    it("should reject phone_number không bắt đầu bằng 0", () => {
      const result = updateProfileSchema.safeParse({ phone_number: "1987654321" });
      expect(result.success).toBe(false);
    });
  });

  describe("field stripping (.strict)", () => {
    it("should strip unknown fields (email, password, role_id)", () => {
      const result = updateProfileSchema.safeParse({
        full_name: "Nguyễn Văn A",
        email: "hacker@evil.com",
        password: "secret",
        role_id: 1,
      });

      expect(result.success).toBe(false);
    });

    it("should accept only known fields", () => {
      const result = updateProfileSchema.safeParse({
        full_name: "Nguyễn Văn A",
        phone_number: "0987654321",
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        full_name: "Nguyễn Văn A",
        phone_number: "0987654321",
      });
    });
  });
});
