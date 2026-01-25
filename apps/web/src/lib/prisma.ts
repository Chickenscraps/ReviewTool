import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
    // Standard initialization - logging for debugging
    const url = process.env.DATABASE_URL;
    if (process.env.NODE_ENV === 'production' && !url) {
        console.error('CRITICAL: DATABASE_URL is missing in production environment');
    }

    return new PrismaClient();
};

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
