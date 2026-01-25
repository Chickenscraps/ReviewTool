import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

// Safe lazy initialization:
// 1. Never initializes immediately on module load.
// 2. Checks for DATABASE_URL before creating client.
// 3. Reuses global instance in dev (HMR safe).
// 4. Proxies access so we only init on first Property Access (e.g. prisma.user.find...)

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

let cachedPrisma: PrismaClient | undefined;

const getPrismaClient = () => {
    // 1. Return cached instance immediately for hot-path speed
    if (cachedPrisma) return cachedPrisma;

    // Check global (HMR/Serverless warm lambdas)
    if (globalForPrisma.prisma) {
        cachedPrisma = globalForPrisma.prisma;
        return cachedPrisma;
    }

    // 2. Initialize
    const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

    if (!connectionString) {
        throw new Error('DATABASE_URL is missing');
    }

    // Initialize with pg driver adapter
    console.log('PRISMA: Initializing new client instance');
    const pool = new Pool({
        connectionString,
        connectionTimeoutMillis: 5000,
        ssl: { rejectUnauthorized: false }
    });
    const adapter = new PrismaPg(pool);
    const client = new PrismaClient({ adapter });

    globalForPrisma.prisma = client;
    cachedPrisma = client;
    return client;
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
