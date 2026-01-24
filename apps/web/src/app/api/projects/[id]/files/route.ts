
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session) return new NextResponse("Unauthorized", { status: 401 });

        const projectId = params.id;

        // Fetch flat list of files for the project
        // Note: The schema links files to projects via... wait, let's check schema.
        // FileNode doesn't explicitly have projectId in the provided snippet logic, 
        // but typically a file system root is per project or global. 
        // The previous 'FileAttachment' model had projectId.
        // The 'FileNode' model seems to be a generic VFS. 
        // We should probably link the root folder to a project or add projectId to FileNode.
        // Checking schema from previous steps:
        /*
        model FileNode { ... parentId ... }
        */
        // If FileNode is global VFS, we need a root folder for the project.
        // Strategy: Find or create a root folder named after the project ID or Name.
        // Or, for MVP, we might just query all FileNodes that are children of a Project Root.

        // For now, let's assume we filter by a root folder that matches the project ID, 
        // or add projectId to FileNode? 
        // Schema update is expensive (migration). 
        // Let's use the 'FileAttachment' model for basic project files as per original schema?
        // No, the instruction was "backend file management" using VFS.
        // Let's assume we create a root FileNode for the project if it doesn't exist.

        const rootNode = await prisma.fileNode.findFirst({
            where: { name: `project-${projectId}`, parentId: null }
        });

        let rootId = rootNode?.id;
        if (!rootNode) {
            // Create root
            const newRoot = await prisma.fileNode.create({
                data: {
                    name: `project-${projectId}`,
                    isFolder: true,
                }
            });
            rootId = newRoot.id;
        }

        // recursive fetch? Prisma doesn't do deep recursive easily.
        // We'll fetch all nodes that are descendants?
        // Implementation: Adjacency list requires multiple queries or loading all and building tree in JS.
        // For MVP, just load all nodes that are part of this tree? 
        // Without a common ancestor field (Materialized Path), finding all descendants is hard.
        // Simple approach: Fetch children of root. UI navigates down.

        const files = await prisma.fileNode.findMany({
            where: { parentId: rootId },
            orderBy: { isFolder: 'desc' }
        });

        return NextResponse.json({ rootId, files });
    } catch (error) {
        console.error('[FILES_GET]', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session) return new NextResponse("Unauthorized", { status: 401 });

        const projectId = params.id;
        const { url, name, size, type, parentId } = await req.json();

        // Ensure root exists
        let effectiveParentId = parentId;
        if (!effectiveParentId) {
            const rootNode = await prisma.fileNode.findFirst({
                where: { name: `project-${projectId}`, parentId: null }
            });
            if (rootNode) effectiveParentId = rootNode.id;
            else {
                const newRoot = await prisma.fileNode.create({
                    data: { name: `project-${projectId}`, isFolder: true }
                });
                effectiveParentId = newRoot.id;
            }
        }

        const fileNode = await prisma.fileNode.create({
            data: {
                name: name || 'Untitled',
                isFolder: false,
                storageId: url, // Storing the full URL or path
                parentId: effectiveParentId,
            },
        });

        return NextResponse.json(fileNode);
    } catch (error) {
        console.error('[FILES_SYNC]', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
