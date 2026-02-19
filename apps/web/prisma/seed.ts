import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { hash } from 'bcryptjs';

const connectionString = process.env.DATABASE_URL || '';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Seeding database...');

    // ============================================================================
    // PERMISSIONS
    // ============================================================================
    console.log('Creating permissions...');

    const permissions = [
        // Projects
        { code: 'projects.view', name: 'View Projects', category: 'Projects', description: 'Can view projects' },
        { code: 'projects.create', name: 'Create Projects', category: 'Projects', description: 'Can create new projects' },
        { code: 'projects.edit', name: 'Edit Projects', category: 'Projects', description: 'Can edit project details' },
        { code: 'projects.delete', name: 'Delete Projects', category: 'Projects', description: 'Can delete/archive projects' },
        // Tasks
        { code: 'tasks.view', name: 'View Tasks', category: 'Tasks', description: 'Can view tasks' },
        { code: 'tasks.create', name: 'Create Tasks', category: 'Tasks', description: 'Can create new tasks' },
        { code: 'tasks.edit', name: 'Edit Tasks', category: 'Tasks', description: 'Can edit task details' },
        { code: 'tasks.delete', name: 'Delete Tasks', category: 'Tasks', description: 'Can delete tasks' },
        { code: 'tasks.assign', name: 'Assign Tasks', category: 'Tasks', description: 'Can assign tasks to users' },
        // Files
        { code: 'files.view', name: 'View Files', category: 'Files', description: 'Can view file attachments' },
        { code: 'files.attach', name: 'Attach Files', category: 'Files', description: 'Can attach files to projects/tasks' },
        { code: 'files.approveOps', name: 'Approve File Operations', category: 'Files', description: 'Can approve file move/rename operations' },
        // Admin
        { code: 'admin.viewUsers', name: 'View Users', category: 'Admin', description: 'Can view user list' },
        { code: 'admin.createUsers', name: 'Create Users', category: 'Admin', description: 'Can create new users' },
        { code: 'admin.editUsers', name: 'Edit Users', category: 'Admin', description: 'Can edit user details' },
        { code: 'admin.manageRoles', name: 'Manage Roles', category: 'Admin', description: 'Can manage roles and permissions' },
        // Audit
        { code: 'audit.view', name: 'View Audit Logs', category: 'Audit', description: 'Can view audit logs' },
    ];

    for (const perm of permissions) {
        await prisma.permission.upsert({
            where: { code: perm.code },
            update: {},
            create: perm,
        });
    }

    // ============================================================================
    // ROLES
    // ============================================================================
    console.log('Creating roles...');

    // Admin role (all permissions)
    const adminRole = await prisma.role.upsert({
        where: { name: 'Admin' },
        update: {},
        create: {
            name: 'Admin',
            description: 'Full system access',
        },
    });

    // Designer role (limited permissions)
    const designerRole = await prisma.role.upsert({
        where: { name: 'Designer' },
        update: {},
        create: {
            name: 'Designer',
            description: 'Motion designer with task editing access',
        },
    });

    // Assign all permissions to Admin
    const allPermissions = await prisma.permission.findMany();
    for (const perm of allPermissions) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id },
            },
            update: {},
            create: {
                roleId: adminRole.id,
                permissionId: perm.id,
            },
        });
    }

    // Assign limited permissions to Designer
    const designerPermissions = [
        'projects.view',
        'tasks.view',
        'tasks.create',
        'tasks.edit',
        'files.view',
        'files.attach',
    ];

    for (const code of designerPermissions) {
        const perm = allPermissions.find((p: { code: string }) => p.code === code);
        if (perm) {
            await prisma.rolePermission.upsert({
                where: {
                    roleId_permissionId: { roleId: designerRole.id, permissionId: perm.id },
                },
                update: {},
                create: {
                    roleId: designerRole.id,
                    permissionId: perm.id,
                },
            });
        }
    }

    // ============================================================================
    // USERS
    // ============================================================================
    console.log('Creating users...');

    // Josh (Admin)
    const joshPassword = await hash('TobieAdmin2026!', 12);
    const josh = await prisma.user.upsert({
        where: { email: 'josh@tobie.team' },
        update: {},
        create: {
            email: 'josh@tobie.team',
            name: 'Josh',
            passwordHash: joshPassword,
            roleId: adminRole.id,
        },
    });

    // Ann (Designer)
    const annPassword = await hash('TobieDesigner2026!', 12);
    const ann = await prisma.user.upsert({
        where: { email: 'ann@tobie.team' },
        update: {},
        create: {
            email: 'ann@tobie.team',
            name: 'Ann Le',
            passwordHash: annPassword,
            roleId: designerRole.id,
        },
    });

    // ============================================================================
    // PROJECT TEMPLATE
    // ============================================================================
    console.log('Creating project template...');

    const template = await prisma.projectTemplate.upsert({
        where: { name: 'Benefits Video Project' },
        update: {},
        create: {
            name: 'Benefits Video Project',
            description: 'Standard benefits plan explainer video workflow',
        },
    });

    const taskTemplates: { title: string; defaultDuration: number; sortOrder: number; defaultAssignee: string | null; dependsOn: string }[] = [
        { title: 'Script Drafting', defaultDuration: 2, sortOrder: 1, defaultAssignee: 'Admin', dependsOn: '[]' },
        { title: 'Script Approval', defaultDuration: 1, sortOrder: 2, defaultAssignee: 'Admin', dependsOn: '' },
        { title: 'Storyboard/Layout', defaultDuration: 3, sortOrder: 3, defaultAssignee: 'Designer', dependsOn: '' },
        { title: 'Motion Graphics', defaultDuration: 5, sortOrder: 4, defaultAssignee: 'Designer', dependsOn: '' },
        { title: 'Rendering', defaultDuration: 1, sortOrder: 5, defaultAssignee: null, dependsOn: '' },
        { title: 'QA Review', defaultDuration: 1, sortOrder: 6, defaultAssignee: 'Admin', dependsOn: '' },
        { title: 'Client Delivery', defaultDuration: 1, sortOrder: 7, defaultAssignee: 'Admin', dependsOn: '' },
    ];

    // Create task templates and track IDs for dependencies
    const createdTemplates: { [key: number]: string } = {};

    for (let i = 0; i < taskTemplates.length; i++) {
        const tt = taskTemplates[i];
        if (!tt) continue;

        const created = await prisma.taskTemplate.create({
            data: {
                title: tt.title,
                defaultDuration: tt.defaultDuration,
                sortOrder: tt.sortOrder,
                defaultAssignee: tt.defaultAssignee,
                dependsOn: i > 0 ? JSON.stringify([createdTemplates[i - 1]]) : '[]',
                templateId: template.id,
            },
        });
        createdTemplates[i] = created.id;
    }

    // ============================================================================
    // DEMO PROJECT
    // ============================================================================
    console.log('Creating demo project...');

    const demoProject = await prisma.project.create({
        data: {
            name: 'Empire Life Q1 Video',
            description: 'Benefits overview video for Empire Life Q1 campaign',
            status: 'ACTIVE',
            template: 'Benefits Video Project',
            startDate: new Date(),
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
            creatorId: josh.id,
        },
    });

    // Create tasks from template
    const demoTasks = [
        { title: 'Script Drafting', status: 'DONE', priority: 0, assigneeId: josh.id, sortOrder: 1 },
        { title: 'Script Approval', status: 'IN_PROGRESS', priority: 80, assigneeId: josh.id, sortOrder: 2, dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) },
        { title: 'Storyboard/Layout', status: 'TODO', priority: 0, assigneeId: ann.id, sortOrder: 3, dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000) },
        { title: 'Motion Graphics', status: 'TODO', priority: 0, assigneeId: ann.id, sortOrder: 4, dueDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000) },
        { title: 'Rendering', status: 'TODO', priority: 0, assigneeId: null, sortOrder: 5, dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) },
        { title: 'QA Review', status: 'TODO', priority: 0, assigneeId: josh.id, sortOrder: 6, dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000) },
        { title: 'Client Delivery', status: 'TODO', priority: 0, assigneeId: josh.id, sortOrder: 7, dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
    ];

    const createdTasks: { [key: number]: string } = {};

    for (let i = 0; i < demoTasks.length; i++) {
        const t = demoTasks[i];
        if (!t) continue;

        const task = await prisma.task.create({
            data: {
                title: t.title,
                status: t.status,
                priority: t.priority,
                assigneeId: t.assigneeId,
                creatorId: josh.id,
                projectId: demoProject.id,
                sortOrder: t.sortOrder,
                dueDate: t.dueDate,
                completedAt: t.status === 'DONE' ? new Date() : null,
            },
        });
        createdTasks[i] = task.id;
    }

    // Create dependencies
    // Create dependencies
    for (let i = 1; i < demoTasks.length; i++) {
        const blockedId = createdTasks[i];
        const blockingId = createdTasks[i - 1];

        if (blockedId && blockingId) {
            await prisma.taskDependency.create({
                data: {
                    blockedTaskId: blockedId,
                    blockingTaskId: blockingId,
                },
            });
        }
    }

    // ============================================================================
    // NEW PROJECTS (Vision & Dental)
    // ============================================================================
    console.log('Creating Vision and Dental projects...');

    const visionProject = await prisma.project.create({
        data: {
            name: 'Vision Benefits Video',
            description: 'Employee vision care plan overview',
            status: 'ACTIVE',
            template: 'Benefits Video Project',
            startDate: new Date(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            creatorId: josh.id,
        },
    });

    const dentalProject = await prisma.project.create({
        data: {
            name: 'Dental Benefits Video',
            description: 'Comprehensive dental coverage explainer',
            status: 'ACTIVE',
            template: 'Benefits Video Project',
            startDate: new Date(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            creatorId: josh.id,
        },
    });

    // Populate tasks for new projects (reusing demo tasks logic for simplicity)
    const populateProjectTasks = async (projectId: string) => {
        const tasks = [
            { title: 'Script Drafting', status: 'TODO', priority: 0, sortOrder: 1, assigneeId: josh.id },
            { title: 'Script Approval', status: 'TODO', priority: 0, sortOrder: 2, assigneeId: josh.id },
            { title: 'Storyboard/Layout', status: 'TODO', priority: 0, sortOrder: 3, assigneeId: ann.id },
            { title: 'Motion Graphics', status: 'TODO', priority: 0, sortOrder: 4, assigneeId: ann.id },
            { title: 'Rendering', status: 'TODO', priority: 0, sortOrder: 5, assigneeId: null },
            { title: 'QA Review', status: 'TODO', priority: 0, sortOrder: 6, assigneeId: josh.id },
            { title: 'Client Delivery', status: 'TODO', priority: 0, sortOrder: 7, assigneeId: josh.id },
        ];

        for (const t of tasks) {
            await prisma.task.create({
                data: {
                    title: t.title,
                    status: t.status,
                    priority: t.priority,
                    assigneeId: t.assigneeId,
                    creatorId: josh.id,
                    projectId: projectId,
                    sortOrder: t.sortOrder,
                }
            });
        }
    };

    await populateProjectTasks(visionProject.id);
    await populateProjectTasks(dentalProject.id);

    // ============================================================================
    // NOTIFICATIONS
    // ============================================================================
    console.log('Creating sample notifications...');

    await prisma.notification.createMany({
        data: [
            {
                type: 'TASK_ASSIGNED',
                title: 'New task assigned',
                message: 'You have been assigned to "Storyboard/Layout"',
                userId: ann.id,
                entityType: 'task',
                entityId: createdTasks[2],
            },
            {
                type: 'TASK_DUE_SOON',
                title: 'Task due soon',
                message: '"Script Approval" is due tomorrow',
                userId: josh.id,
                entityType: 'task',
                entityId: createdTasks[1],
            },
            {
                type: 'PROJECT_CREATED',
                title: 'New project created',
                message: 'Empire Life Q1 Video has been created',
                userId: josh.id,
                entityType: 'project',
                entityId: demoProject.id,
                read: true,
            },
        ],
    });

    // ============================================================================
    // ASSETS (Video & Static)
    // ============================================================================
    console.log('Creating sample assets...');

    // 1. Video Asset
    await prisma.asset.upsert({
        where: { publicToken: 'sample-video-token' },
        update: {},
        create: {
            title: 'Q1 Motion Graphics Draft',
            projectId: demoProject.id,
            type: 'VIDEO',
            mode: 'VIDEO',
            publicToken: 'sample-video-token',
            version: 1,
            fileUrl: '/samples/motion_example.mp4',
            duration: 125.5, // 2m 05s
            status: 'UNDER_REVIEW',
            createdBy: josh.id,
            comments: {
                create: [
                    {
                        content: "Great start! The timing feels a bit off here.",
                        timestamp: 15.5,
                        authorId: ann.id,
                    },
                    {
                        content: "Can we make the logo bigger?",
                        timestamp: 45.0,
                        authorId: josh.id,
                        isResolved: true,
                        resolvedBy: ann.id,
                    }
                ]
            }
        },
    });

    // 2. Static Asset (Image/PDF)
    await prisma.asset.upsert({
        where: { publicToken: 'sample-static-token' },
        update: {},
        create: {
            title: 'Storyboard - Scene 1',
            projectId: demoProject.id,
            type: 'IMAGE',
            mode: 'STATIC',
            publicToken: 'sample-static-token',
            version: 1,
            fileUrl: 'https://images.unsplash.com/photo-1626785774573-4b79931bfd93?auto=format&fit=crop&q=80&w=2000',
            status: 'PENDING',
            createdBy: ann.id,
            annotations: {
                create: [
                    {
                        pageIndex: 0,
                        x: 0.2,
                        y: 0.3,
                        width: 0.1,
                        height: 0.1,
                        authorId: josh.id,
                        comment: "Is this character final?"
                    }
                ]
            }
        },
    });

    console.log('✅ Database seeded successfully!');
    console.log('\nTest accounts:');
    console.log('  Admin: josh@tobie.team / TobieAdmin2026!');
    console.log('  Designer: ann@tobie.team / TobieDesigner2026!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
