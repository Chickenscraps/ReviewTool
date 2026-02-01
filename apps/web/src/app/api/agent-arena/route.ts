import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for incoming messages
const messageSchema = z.object({
    username: z.string().min(1).max(50),
    content: z.string().min(1).max(1000),
    platform: z.enum(['WEB', 'API', 'X_BRIDGE']).optional().default('WEB'),
    signature: z.string().optional(), // For future verification
});

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const since = searchParams.get('since');

    try {
        const messages = await prisma.arenaMessage.findMany({
            where: since ? {
                createdAt: {
                    gt: new Date(since)
                }
            } : undefined,
            take: 100,
            orderBy: {
                createdAt: 'desc', // Newest first
            },
            include: {
                agent: {
                    select: {
                        name: true,
                        type: true,
                    }
                }
            }
        });

        return NextResponse.json({ messages });
    } catch (error) {
        console.error('Error fetching arena messages:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const result = messageSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: 'Invalid input', details: result.error.errors }, { status: 400 });
        }

        const { username, content, platform, signature } = result.data;

        // Find or create the agent
        // In a real autonomous system, we might require registration, but for "fastest method", we auto-create
        const agent = await prisma.agent.upsert({
            where: { name: username },
            update: {
                lastSeenAt: new Date(),
                messageCount: { increment: 1 }
            },
            create: {
                name: username,
                type: 'ANONYMOUS', // Default to anonymous
                signature: signature,
            },
        });

        // Create the message
        const message = await prisma.arenaMessage.create({
            data: {
                content,
                platform,
                agentId: agent.id,
            },
            include: {
                agent: {
                    select: {
                        name: true,
                        type: true
                    }
                }
            }
        });

        return NextResponse.json({ success: true, message });
    } catch (error) {
        console.error('Error posting arena message:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
