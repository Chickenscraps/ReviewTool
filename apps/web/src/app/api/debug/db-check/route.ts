import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log('Testing DB connectivity...');
        const userCount = await prisma.user.count();
        const admin = await prisma.user.findUnique({
            where: { email: 'josh@tobie.team' },
            select: { id: true, email: true, passwordHash: true }
        });

        const connString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL || '';
        let host = 'n/a';
        let port = 'n/a';
        try {
            const u = new URL(connString);
            host = u.hostname;
            port = u.port || '5432';
        } catch (e) { }

        return NextResponse.json({
            status: 'success',
            connection: 'OK',
            debugVersion: '2026-01-24-V3',
            userCount,
            adminExists: !!admin,
            envUsed: process.env.SUPABASE_DATABASE_URL ? 'SUPABASE_DATABASE_URL' : 'DATABASE_URL',
            host,
            port,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('DB Connection Failed:', error);
        return NextResponse.json({
            status: 'error',
            message: error.message,
            name: error.name,
            // Check if it's a Prisma init/connection error
            isPrismaError: error.name?.includes('Prisma'),
            fullError: error.toString(),
            stack: error.stack?.split('\n').slice(0, 3).join('\n')
        }, { status: 500 });
    }
}
