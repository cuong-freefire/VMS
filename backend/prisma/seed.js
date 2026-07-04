import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding roles...');

    const roles = [
        { name: 'VOLUNTEER', description: 'Tình nguyện viên tham gia sự kiện' },
        { name: 'STAFF', description: 'Nhân viên quản lý sự kiện và xét duyệt' },
        { name: 'MANAGER', description: 'Quản lý cấp trung, quản lý danh mục' },
        { name: 'ADMIN', description: 'Quản trị viên hệ thống' }
    ];

    for (const role of roles) {
        await prisma.role.upsert({
            where: { name: role.name },
            update: {},
            create: role
        });
    }

    console.log('✅ Roles seeded successfully');

    // Seed test email verifications for testing
    console.log('Seeding email verifications for testing...');

    const testOtpHash = await bcrypt.hash('123456', 10);

    const emailVerifications = [
        {
            email: 'test.register@example.com',
            otpHash: testOtpHash,
            type: 'REGISTER',
            attempts: 0,
            isLocked: false,
            lastSentAt: new Date(),
        },
        {
            email: 'test.pending@example.com',
            otpHash: testOtpHash,
            type: 'REGISTER',
            attempts: 2,
            isLocked: false,
            lastSentAt: new Date(Date.now() - 30000), // 30 seconds ago
        },
        {
            email: 'test.locked@example.com',
            otpHash: testOtpHash,
            type: 'REGISTER',
            attempts: 5,
            isLocked: true,
            lockedUntil: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
            lastSentAt: new Date(),
        },
        {
            email: 'test.expired@example.com',
            otpHash: testOtpHash,
            type: 'REGISTER',
            attempts: 0,
            isLocked: false,
            createdAt: new Date(Date.now() - 11 * 60 * 1000), // 11 minutes ago (expired)
            lastSentAt: new Date(Date.now() - 11 * 60 * 1000),
        },
    ];

    for (const emailVerification of emailVerifications) {
        await prisma.emailVerification.upsert({
            where: {
                email_type: {
                    email: emailVerification.email,
                    type: emailVerification.type,
                },
            },
            update: emailVerification,
            create: emailVerification,
        });
    }

    console.log('✅ Email verifications seeded successfully');
}

main();
