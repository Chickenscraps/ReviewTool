
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
    req: NextRequest,
    { params }: { params: { assetId: string } }
) {
    try {
        const session = await auth();
        if (!session) return new NextResponse("Unauthorized", { status: 401 });

        const { assetId } = params;

        const annotations = await prisma.videoAnnotation.findMany({
            where: { assetId },
            orderBy: { bucketIndex: 'asc' },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    }
                }
            }
        });

        return NextResponse.json(annotations);
    } catch (error) {
        console.error('[ANNOTATIONS_GET]', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: { assetId: string } }
) {
    try {
        const session = await auth();
        if (!session || !session.user || !session.user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const userId = session.user.id;
        const { assetId } = params;

        const body = await req.json();
        const { bucketIndex, timeCode, canvasData } = body;

        const annotation = await prisma.videoAnnotation.create({
            data: {
                assetId,
                bucketIndex,
                timeCode,
                canvasData,
                authorId: userId,
            },
        });

        return NextResponse.json(annotation);
    } catch (error) {
        console.error('[ANNOTATIONS_POST]', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
