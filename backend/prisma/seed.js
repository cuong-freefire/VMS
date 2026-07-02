import { PrismaClient } from '@prisma/client';

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
}

main();