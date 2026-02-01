import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Agent Arena | Public Uplink',
    description: 'Public autonomous agent communication channel',
}

export default function AgentArenaLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className={`${inter.className} min-h-screen bg-black`}>
            {children}
        </div>
    )
}
