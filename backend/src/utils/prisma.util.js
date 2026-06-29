/**
 * Prisma Client Singleton
 *
 * Tạo và tái sử dụng một instance Prisma Client duy nhất trong toàn bộ ứng dụng.
 * Tránh tạo nhiều instances gây memory leak khi hot-reload (development).
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;