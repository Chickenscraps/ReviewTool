import { cache } from 'react';
import { auth } from './auth';
import { prisma } from './prisma';
import type { PermissionCode } from '@tobie/shared';

/**
 * Get the current user from the session with role and permissions
 * Cached per-request in Next.js
 */
export const getCurrentUser = cache(async () => {
    const session = await auth();

    if (!session?.user?.id) {
        return null;
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            role: {
                include: {
                    permissions: {
                        include: {
                            permission: true,
                        },
                    },
                },
            },
        },
    });

    if (!user) return null;

    return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: {
            id: user.role.id,
            name: user.role.name,
            description: user.role.description,
            permissions: user.role.permissions.map((rp) => ({
                id: rp.permission.id,
                code: rp.permission.code,
                name: rp.permission.name,
                description: rp.permission.description,
                category: rp.permission.category,
            })),
        },
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
    };
});

/**
 * Check if the current user has a specific permission
 */
export async function hasPermission(permissionCode: PermissionCode): Promise<boolean> {
    const user = await getCurrentUser();
    if (!user) return false;
    return user.role.permissions.some((p) => p.code === permissionCode);
}

/**
 * Require a specific permission, throw if not authorized
 */
export async function requirePermission(permissionCode: PermissionCode): Promise<void> {
    const hasAccess = await hasPermission(permissionCode);

    if (!hasAccess) {
        const user = await getCurrentUser();

        // Log permission denied
        await prisma.auditLog.create({
            data: {
                eventType: 'PERMISSION_DENIED',
                eventSource: 'web-portal',
                userId: user?.id,
                details: JSON.stringify({ permission: permissionCode }),
            },
        });

        throw new Error('Permission denied');
    }
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
    return hasPermission('admin.manageRoles' as PermissionCode);
}
