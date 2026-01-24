import { PrismaClient } from '@prisma/client';

declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
}

// Standard Prisma Client initialization
// This relies on the Rust binary engine which we have correctly configured for Netlify (rhel-openssl-3.0.x)
// Removing @prisma/adapter-pg to avoid pool connection issues in serverless environment
export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
}
