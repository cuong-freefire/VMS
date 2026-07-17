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

import { jest, beforeEach, afterEach, describe, it, expect } from '@jest/globals';

// Mock transporter.sendMail BEFORE importing emailService
// email.service.js imports transporter at module level and calls
// transporter.sendMail directly inside the sendEmail closure.
// Since sendVerificationEmail etc. call sendEmail (the closure),
// spying on emailService.sendEmail has no effect.
// We must mock at the transporter level.
const mockSendMail = jest.fn();

jest.unstable_mockModule('../../src/config/transporter.config.js', () => ({
    transporter: {
        sendMail: mockSendMail,
    },
    verifyTransporter: jest.fn().mockResolvedValue(true),
}));

const emailServiceModule = await import('../../src/services/email.service.js');
const emailService = emailServiceModule.default;

beforeEach(() => {
    jest.clearAllMocks();
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe('EmailService', () => {
    // ─── Core sendEmail ───
    describe('sendEmail', () => {
        it('should return success with messageId on successful send', async () => {
            mockSendMail.mockResolvedValue({ messageId: '<test123@mail>' });

            const result = await emailService.sendEmail(
                'test@example.com',
                'Test Subject',
                '<p>Test</p>'
            );

            expect(result.success).toBe(true);
            expect(result.messageId).toBe('<test123@mail>');
            expect(mockSendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'test@example.com',
                    subject: 'Test Subject',
                    html: '<p>Test</p>',
                })
            );
        });

        it('should return error on send failure', async () => {
            mockSendMail.mockRejectedValue(new Error('SMTP connection timeout'));

            const result = await emailService.sendEmail(
                'test@example.com',
                'Test Subject',
                '<p>Test</p>'
            );

            expect(result.success).toBe(false);
            expect(result.error).toBe('SMTP connection timeout');
        });
    });

    // ─── UC62: Verification Email ───
    describe('sendVerificationEmail', () => {
        it('should delegate to sendEmail with correct args', async () => {
            mockSendMail.mockResolvedValue({ messageId: '<msg1>' });

            const result = await emailService.sendVerificationEmail(
                'user@test.com', 'Test User', '123456', 10
            );

            expect(result.success).toBe(true);
            expect(mockSendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'user@test.com',
                    subject: 'Xác thực tài khoản VMS',
                })
            );
        });
    });

    // ─── UC63: Reset Password Email ───
    describe('sendResetPasswordEmail', () => {
        it('should delegate to sendEmail with correct args', async () => {
            mockSendMail.mockResolvedValue({ messageId: '<msg2>' });

            const result = await emailService.sendResetPasswordEmail(
                'user@test.com', 'Test User', '654321', 10
            );

            expect(result.success).toBe(true);
            expect(mockSendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'user@test.com',
                })
            );
        });
    });

    // ─── UC64: Approval Email ───
    describe('sendApprovalEmail', () => {
        it('should delegate to sendEmail with event details', async () => {
            mockSendMail.mockResolvedValue({ messageId: '<msg3>' });

            const result = await emailService.sendApprovalEmail(
                'volunteer@test.com',
                'Nguyen Van A',
                'Don rac bai bien',
                '2026-07-15 08:00',
                'Bien Vung Tau'
            );

            expect(result.success).toBe(true);
            expect(mockSendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'volunteer@test.com',
                })
            );
        });
    });

    // ─── UC64: Rejection Email ───
    describe('sendRejectionEmail', () => {
        it('should delegate to sendEmail with rejection reason', async () => {
            mockSendMail.mockResolvedValue({ messageId: '<msg4>' });

            const result = await emailService.sendRejectionEmail(
                'volunteer@test.com',
                'Nguyen Van A',
                'Don rac bai bien',
                'Da du tinh nguyen vien'
            );

            expect(result.success).toBe(true);
            expect(mockSendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'volunteer@test.com',
                })
            );
        });

        it('should handle missing reason', async () => {
            mockSendMail.mockResolvedValue({ messageId: '<msg5>' });

            const result = await emailService.sendRejectionEmail(
                'volunteer@test.com', 'Name', 'Event'
            );

            expect(result.success).toBe(true);
        });
    });

    // ─── UC65: Reminder Email ───
    describe('sendReminderEmail', () => {
        it('should delegate to sendEmail with reminder content', async () => {
            mockSendMail.mockResolvedValue({ messageId: '<msg6>' });

            const result = await emailService.sendReminderEmail(
                'volunteer@test.com',
                'Nguyen Van A',
                'Don rac bai bien',
                '2026-07-15 08:00'
            );

            expect(result.success).toBe(true);
        });
    });

    // ─── UC66: Certificate Email ───
    describe('sendCertificateEmail', () => {
        it('should return error for non-existent file', async () => {
            const result = await emailService.sendCertificateEmail(
                'volunteer@test.com',
                'Nguyen Van A',
                'Don rac bai bien',
                '/nonexistent/path/certificate.pdf'
            );

            expect(result.success).toBe(false);
            expect(result.error).toContain('ENOENT');
        });

        it('should not call sendMail if file not found', async () => {
            await emailService.sendCertificateEmail(
                'volunteer@test.com',
                'Name',
                'Event',
                '/nonexistent/file.pdf'
            );

            expect(mockSendMail).not.toHaveBeenCalled();
        });
    });
});