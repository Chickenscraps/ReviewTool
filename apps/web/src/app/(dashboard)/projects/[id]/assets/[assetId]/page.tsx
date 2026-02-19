import { redirect } from 'next/navigation';
import { prisma } from '@tobie/shared'; // Assuming shared prisma instance, or we import locally if monorepo setup varies
// Fallback to local prisma if shared package isn't set up perfectly in this environment
import { PrismaClient } from '@prisma/client';

import { StaticReviewShell } from '@/components/review/StaticReviewShell';
import { VideoReviewShell } from '@/components/review/VideoReviewShell';
import { auth } from '@/lib/auth';

// Initialize Prisma (using global for dev HMR if needed, but keeping simple here)
const db = new PrismaClient();

export default async function AssetReviewPage({ params }: { params: { id: string; assetId: string } }) {
  const session = await auth();
  if (!session) redirect('/login');

  const asset = await db.asset.findUnique({
    where: { id: params.assetId },
    include: {
      creator: true,
      comments: { 
        include: { author: true },
        orderBy: { timestamp: 'asc' }
      },
      annotations: {
        include: { author: true }
      }
    }
  });

  if (!asset) {
    return (
      <div className="flex items-center justify-center h-screen text-neutral-400">
        Asset not found
      </div>
    );
  }

  // Dual Mode Routing
  if (asset.mode === 'STATIC') {
    return <StaticReviewShell asset={asset} />;
  } else {
    return <VideoReviewShell asset={asset} />;
  }
}
