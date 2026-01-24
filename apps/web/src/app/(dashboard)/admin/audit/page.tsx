import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { redirect } from 'next/navigation';

export default async function AdminAuditPage() {
    const canView = await hasPermission('audit.view' as any);

    if (!canView) {
        redirect('/dashboard');
    }

    const logs = await prisma.auditLog.findMany({
        include: {
            user: { select: { name: true, email: true } },
        },
        orderBy: { timestamp: 'desc' },
        take: 100,
    });

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-white">Audit Log</h1>
                <p className="text-gray-400 mt-1">
                    Complete record of system actions (append-only)
                </p>
            </div>

            <div className="card overflow-hidden p-0">
                <table className="w-full">
                    <thead className="bg-white/5">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Timestamp
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Event
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Source
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Details
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {logs.map((log: any) => (
                            <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">
                                    {new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`badge ${getEventBadge(log.eventType)}`}>
                                        {log.eventType.replace(/_/g, ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-white">
                                    {log.user ? log.user.name : <span className="text-gray-500">System</span>}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-400">
                                    {log.eventSource}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-400 max-w-md truncate">
                                    {formatDetails(log.details)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function getEventBadge(eventType: string) {
    if (eventType.includes('SUCCESS') || eventType.includes('CREATE')) return 'badge-green';
    if (eventType.includes('FAILURE') || eventType.includes('DENIED') || eventType.includes('DELETE')) return 'badge-red';
    if (eventType.includes('UPDATE') || eventType.includes('CHANGE')) return 'badge-amber';
    return 'badge-gray';
}

function formatDetails(details: string) {
    try {
        const parsed = JSON.parse(details);
        return Object.entries(parsed)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
    } catch {
        return details;
    }
}
