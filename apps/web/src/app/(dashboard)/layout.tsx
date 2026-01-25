import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getCurrentUser } from '@/lib/permissions';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MobileLayout } from '@/components/mobile';
import GlobalChatWidget from '@/components/ai/GlobalChatWidget';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // getCurrentUser is cached per-request and handles session check internally
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    return (
        <div className="flex h-screen overflow-hidden bg-brand-dark">
            <Sidebar user={user} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header user={user} />
                {/* Add bottom padding on mobile for bottom nav */}
                <main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
            {/* Mobile-specific components (BottomNav + ChatSidebar) */}
            <MobileLayout />
            <GlobalChatWidget />
        </div>
    );
}
