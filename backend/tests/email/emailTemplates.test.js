/**
 * Unit Tests: Email Template Builders (MD15)
 * Owner: Member 1 (CuongLH)
 *
 * Tests 6 HTML template builders for correctness:
 * - All dynamic data properly interpolated
 * - UTF-8 Vietnamese characters render correctly
 * - Fallback values for missing optional fields
 * - All templates produce valid HTML structure
 */

import {
    buildVerificationOtpTemplate,
    buildResetPasswordOtpTemplate,
    buildApprovalTemplate,
    buildRejectionTemplate,
    buildReminderTemplate,
    buildCertificateTemplate,
} from "../../src/services/emailTemplates.utility.js";

describe("Email Template Builders", () => {
    // ─── UC62: Verification OTP ───
    describe("buildVerificationOtpTemplate", () => {
        it("should contain user name and OTP code", () => {
            const html = buildVerificationOtpTemplate("Nguyen Van A", "123456", 10);
            expect(html).toContain("Nguyen Van A");
            expect(html).toContain("123456");
            expect(html).toContain("10 phút");
        });

        it("should use fallback name when userName is empty", () => {
            const html = buildVerificationOtpTemplate("", "123456");
            expect(html).toContain("người dùng");
        });

        it("should produce valid HTML with UTF-8 charset", () => {
            const html = buildVerificationOtpTemplate("Test", "000000");
            expect(html).toContain("<!DOCTYPE html>");
            expect(html).toContain('charset="UTF-8"');
            expect(html).toContain("</html>");
        });

        it("should contain Vietnamese text", () => {
            const html = buildVerificationOtpTemplate("Nguyễn Văn A", "123456");
            expect(html).toContain("Xác thực tài khoản");
            expect(html).toContain("Hệ thống Quản lý Tình nguyện");
        });
    });

    // ─── UC63: Reset Password OTP ───
    describe("buildResetPasswordOtpTemplate", () => {
        it("should contain OTP and security warning", () => {
            const html = buildResetPasswordOtpTemplate("Nguyen Van A", "654321", 10);
            expect(html).toContain("654321");
            expect(html).toContain("Cảnh báo bảo mật");
            expect(html).toContain("bỏ qua email này");
        });

        it("should produce valid HTML", () => {
            const html = buildResetPasswordOtpTemplate("Test", "000000");
            expect(html).toContain("<!DOCTYPE html>");
            expect(html).toContain("</html>");
        });
    });

    // ─── UC64: Event Approval ───
    describe("buildApprovalTemplate", () => {
        it("should contain event and volunteer details", () => {
            const html = buildApprovalTemplate(
                "Nguyen Van A",
                "Dọn rác bãi biển",
                "2026-07-15 08:00",
                "Biển Vũng Tàu"
            );
            expect(html).toContain("Nguyen Van A");
            expect(html).toContain("Dọn rác bãi biển");
            expect(html).toContain("2026-07-15 08:00");
            expect(html).toContain("Biển Vũng Tàu");
            expect(html).toContain("chấp nhận");
        });

        it("should handle missing location gracefully", () => {
            const html = buildApprovalTemplate("Test", "Event", "2026-01-01");
            expect(html).toContain("<!DOCTYPE html>");
            expect(html).not.toContain("Địa điểm");
        });

        it("should use fallback name", () => {
            const html = buildApprovalTemplate("", "Event", "2026-01-01");
            expect(html).toContain("Tình nguyện viên");
        });
    });

    // ─── UC64: Event Rejection ───
    describe("buildRejectionTemplate", () => {
        it("should contain rejection message and reason", () => {
            const html = buildRejectionTemplate(
                "Nguyen Van A",
                "Dọn rác bãi biển",
                "Sự kiện đã đủ tình nguyện viên"
            );
            expect(html).toContain("không được chấp nhận");
            expect(html).toContain("Sự kiện đã đủ tình nguyện viên");
        });

        it("should handle missing reason gracefully", () => {
            const html = buildRejectionTemplate("Test", "Event");
            expect(html).toContain("<!DOCTYPE html>");
            expect(html).not.toContain("Lý do:");
        });
    });

    // ─── UC65: Event Reminder ───
    describe("buildReminderTemplate", () => {
        it("should contain reminder message with event details", () => {
            const html = buildReminderTemplate(
                "Nguyen Van A",
                "Dọn rác bãi biển",
                "2026-07-15 08:00",
                "Biển Vũng Tàu"
            );
            expect(html).toContain("sắp diễn ra");
            expect(html).toContain("24 giờ");
            expect(html).toContain("Dọn rác bãi biển");
            expect(html).toContain("Biển Vũng Tàu");
        });

        it("should handle missing location", () => {
            const html = buildReminderTemplate("Test", "Event", "2026-01-01");
            expect(html).toContain("<!DOCTYPE html>");
            expect(html).not.toContain("Địa điểm");
        });
    });

    // ─── UC66: Certificate ───
    describe("buildCertificateTemplate", () => {
        it("should contain congratulations and event name", () => {
            const html = buildCertificateTemplate(
                "Nguyen Van A",
                "Dọn rác bãi biển"
            );
            expect(html).toContain("Chúc mừng");
            expect(html).toContain("Dọn rác bãi biển");
            expect(html).toContain("Nguyen Van A");
            expect(html).toContain("chứng nhận");
        });

        it("should use fallback values", () => {
            const html = buildCertificateTemplate("", "");
            expect(html).toContain("Tình nguyện viên");
            expect(html).toContain("sự kiện");
        });
    });
});
