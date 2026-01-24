import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import { RolePermissionEditor } from './RolePermissionEditor';

export default async function AdminRolesPage() {
    const canManage = await hasPermission('admin.manageRoles' as any);

    if (!canManage) {
        redirect('/dashboard');
    }

    const [roles, permissions] = await Promise.all([
        prisma.role.findMany({
            include: {
                permissions: {
                    include: { permission: true },
                },
                _count: { select: { users: true } },
            },
            orderBy: { name: 'asc' },
        }),
        prisma.permission.findMany({
            orderBy: [{ category: 'asc' }, { name: 'asc' }],
        }),
    ]);

    // Group permissions by category
    const permissionsByCategory = permissions.reduce((acc: Record<string, typeof permissions>, perm) => {
        if (!acc[perm.category]) {
            acc[perm.category] = [];
        }
        acc[perm.category]?.push(perm);
        return acc;
    }, {} as Record<string, typeof permissions>);

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-white">Roles & Permissions</h1>
                <p className="text-gray-400 mt-1">
                    Configure role permissions with checkbox controls
                </p>
            </div>

            <div className="grid gap-6">
                {roles.map((role) => (
                    <RolePermissionEditor
                        key={role.id}
                        role={{
                            id: role.id,
                            name: role.name,
                            description: role.description,
                            userCount: role._count.users,
                            permissions: role.permissions.map((rp) => rp.permission.id),
                        }}
                        permissionsByCategory={permissionsByCategory}
                    />
                ))}
            </div>
        </div>
    );
}
