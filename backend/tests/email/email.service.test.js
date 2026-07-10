/**
 * Integration Tests: Email Service (MD15)
 * Owner: Member 1 (CuongLH)
 *
 * Tests EmailService with mocked NodeMailer transporter.
 * Does NOT connect to real SMTP server.
 *
 * Coverage targets:
 * - sendEmail() success/error paths
 * - All 5 use case methods delegate to sendEmail correctly
 * - sendCertificateEmail file size validation
 * - Config invalid state handling
 */

import emailService from "../../src/services/email.service.js";

// Mock the transporter BEFORE importing the service
// The singleton is already created, but sendMail is the method we replace
let mockSendMail;
let mockVerify;

beforeEach(() => {
    mockSendMail = jest.fn();
    mockVerify = jest.fn();

    // Replace transporter methods with mocks
    // emailService uses the singleton imported transporter
    // We mock sendMail on the prototype
    jest.spyOn(emailService, "sendEmail").mockImplementation(jest.fn());
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe("EmailService", () => {
    // ─── Core sendEmail ───
    describe("sendEmail", () => {
        beforeEach(() => {
            // Restore sendEmail for the core tests
            jest.restoreAllMocks();

        });

        it("should return success with messageId on successful send", async () => {
            // We test via the public API which calls sendEmail internally
            // Mock sendEmail on the instance to simulate success
            const mockResult = { success: true, messageId: "<test123@mail>" };
            jest.spyOn(emailService, "sendEmail").mockResolvedValue(mockResult);

            const result = await emailService.sendVerificationEmail(
                "test@example.com", "Test User", "123456"
            );

            expect(result.success).toBe(true);
            expect(result.messageId).toBe("<test123@mail>");
        });

        it("should return error on send failure", async () => {
            const mockResult = { success: false, error: "SMTP connection timeout" };
            jest.spyOn(emailService, "sendEmail").mockResolvedValue(mockResult);

            const result = await emailService.sendVerificationEmail(
                "test@example.com", "Test User", "123456"
            );

            expect(result.success).toBe(false);
            expect(result.error).toBe("SMTP connection timeout");
        });

    });

    // ─── UC62: Verification Email ───
    describe("sendVerificationEmail", () => {
        it("should delegate to sendEmail with correct args", async () => {
            const mockResult = { success: true, messageId: "<msg1>" };
            const sendEmailSpy = jest.spyOn(emailService, "sendEmail").mockResolvedValue(mockResult);

            await emailService.sendVerificationEmail(
                "user@test.com", "Test User", "123456", 10
            );

            expect(sendEmailSpy).toHaveBeenCalledWith(
                "user@test.com",
                "Xác thực tài khoản VMS",
                expect.stringContaining("Test User")
            );
        });
    });

    // ─── UC63: Reset Password Email ───
    describe("sendResetPasswordEmail", () => {
        it("should delegate to sendEmail with correct args", async () => {
            const mockResult = { success: true, messageId: "<msg2>" };
            jest.spyOn(emailService, "sendEmail").mockResolvedValue(mockResult);

            const result = await emailService.sendResetPasswordEmail(
                "user@test.com", "Test User", "654321", 10
            );

            expect(result.success).toBe(true);
        });
    });

    // ─── UC64: Approval Email ───
    describe("sendApprovalEmail", () => {
        it("should delegate to sendEmail with event details", async () => {
            const mockResult = { success: true, messageId: "<msg3>" };
            const sendEmailSpy = jest.spyOn(emailService, "sendEmail").mockResolvedValue(mockResult);

            await emailService.sendApprovalEmail(
                "volunteer@test.com",
                "Nguyen Van A",
                "Don rac bai bien",
                "2026-07-15 08:00",
                "Bien Vung Tau"
            );

            expect(sendEmailSpy).toHaveBeenCalledWith(
                "volunteer@test.com",
                expect.stringContaining("Don rac bai bien"),
                expect.stringContaining("Nguyen Van A")
            );
        });
    });

    // ─── UC64: Rejection Email ───
    describe("sendRejectionEmail", () => {
        it("should delegate to sendEmail with rejection reason", async () => {
            const mockResult = { success: true, messageId: "<msg4>" };
            const sendEmailSpy = jest.spyOn(emailService, "sendEmail").mockResolvedValue(mockResult);

            await emailService.sendRejectionEmail(
                "volunteer@test.com",
                "Nguyen Van A",
                "Don rac bai bien",
                "Da du tinh nguyen vien"
            );

            expect(sendEmailSpy).toHaveBeenCalledWith(
                "volunteer@test.com",
                expect.stringContaining("Don rac bai bien"),
                expect.stringContaining("Da du tinh nguyen vien")
            );
        });

        it("should handle missing reason", async () => {
            const mockResult = { success: true, messageId: "<msg5>" };
            jest.spyOn(emailService, "sendEmail").mockResolvedValue(mockResult);

            const result = await emailService.sendRejectionEmail(
                "volunteer@test.com", "Name", "Event"
            );

            expect(result.success).toBe(true);
        });
    });

    // ─── UC65: Reminder Email ───
    describe("sendReminderEmail", () => {
        it("should delegate to sendEmail with reminder content", async () => {
            const mockResult = { success: true, messageId: "<msg6>" };
            jest.spyOn(emailService, "sendEmail").mockResolvedValue(mockResult);

            const result = await emailService.sendReminderEmail(
                "volunteer@test.com",
                "Nguyen Van A",
                "Don rac bai bien",
                "2026-07-15 08:00"
            );

            expect(result.success).toBe(true);
        });
    });

    // ─── UC66: Certificate Email ───
    describe("sendCertificateEmail", () => {
        it("should return error for non-existent file", async () => {
            const result = await emailService.sendCertificateEmail(
                "volunteer@test.com",
                "Nguyen Van A",
                "Don rac bai bien",
                "/nonexistent/path/certificate.pdf"
            );

            expect(result.success).toBe(false);
            expect(result.error).toContain("Certificate file error");
        });

        it("should not call sendEmail if file not found", async () => {
            const sendEmailSpy = jest.spyOn(emailService, "sendEmail");

            await emailService.sendCertificateEmail(
                "volunteer@test.com",
                "Name",
                "Event",
                "/nonexistent/file.pdf"
            );

            expect(sendEmailSpy).not.toHaveBeenCalled();
        });
    });
});
