
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { ScopeGuardian } from '@/lib/ai/ScopeGuardian';

export const dynamic = 'force-dynamic';

// Initialize Guardian lazily or safely
const getGuardian = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not set");
    return new ScopeGuardian(apiKey);
};

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || !session.user || !session.user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { message, projectId, previousSignature } = body;

        // Fetch Project Context (SOW or summary)
        // For MVP, we'll fetch a "Scope Definition" from the project description or a dedicated field
        // If not found, use a default strict prompt.
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { description: true, name: true }
        });

        if (!project) return new NextResponse("Project not found", { status: 404 });

        const scopeContext = `
        Project: ${project.name}
        Description: ${project.description || "No description provided."}
        
        Note: Strict adherence to standard web development deliverables is required. 
        Video editing is in scope. 
        3D Animation is OUT of scope unless specified.
        `;

        const guardian = getGuardian();
        const result = await guardian.checkScope(message, scopeContext, previousSignature);

        // Store Transcript
        await prisma.chatTranscript.create({
            data: {
                userId: session.user.id,
                projectId: projectId,
                messages: JSON.stringify([
                    { role: 'user', content: message, timestamp: Date.now() },
                    {
                        role: 'assistant',
                        content: result.suggestedResponse,
                        timestamp: Date.now(),
                        metadata: {
                            reasoning: result.reasoning,
                            isAllowed: result.isAllowed,
                            signature: result.thoughtSignature
                        }
                    }
                ])
            }
        });

        return NextResponse.json(result);

    } catch (error) {
        console.error('[SCOPE_CHECK]', error);
        return new NextResponse("Internal Error: " + (error as Error).message, { status: 500 });
    }
}
