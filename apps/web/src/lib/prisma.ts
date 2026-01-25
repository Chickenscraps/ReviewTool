import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

// Safe lazy initialization:
// 1. Never initializes immediately on module load.
// 2. Checks for DATABASE_URL before creating client.
// 3. Reuses global instance in dev (HMR safe).
// 4. Proxies access so we only init on first Property Access (e.g. prisma.user.find...)

const getPrismaClient = () => {
    // Check if we are in a build phase where we shouldn't connect
    // const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
    const hasDbUrl = !!process.env.DATABASE_URL;

    // If we're building and don't have a DB, return a "Null Object" or throw a specific warning
    // But typically, the proxy pattern avoids calling this function until a method is actually called.

    if (!hasDbUrl) {
        console.error('PRISMA FATAL: DATABASE_URL is missing from process.env');
        throw new Error('DATABASE_URL is missing');
    }

    if (!globalForPrisma.prisma) {
        globalForPrisma.prisma = new PrismaClient({
            datasources: {
                db: {
                    url: process.env.DATABASE_URL,
                },
            },
        });
    }
    return globalForPrisma.prisma;
};

// The export is a Proxy. It looks like PrismaClient to the app, 
// but it doesn't run "new PrismaClient()" until you do "prisma.user" or "prisma.connect"
export const prisma = new Proxy({} as PrismaClient, {
    get: (target, prop) => {
        // Pass through promises to avoid triggering init on 'then' checks
        if (prop === 'then') return Promise.resolve(target);

        // On first real access, initialize
        try {
            const client = getPrismaClient();
            // @ts-ignore
            const value = client[prop];

            if (typeof value === 'function') {
                return value.bind(client);
            }
            return value;
        } catch (error) {
            console.error(`PRISMA: Failed to lazy-init or access property ${String(prop)}`, error);
            throw error;
        }
    },
});

if (process.env.NODE_ENV !== 'production') {
    // In dev, we don't set the global here because the Proxy handles the singleton logic via getPrismaClient
    // matching the globalForPrisma check.
}
