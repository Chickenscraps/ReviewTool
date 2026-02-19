'use client';

import { useRef, useState } from 'react';
import { Asset, Annotation, User, Comment } from '@prisma/client';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { CommentTimeline } from '@/components/video/CommentTimeline';

interface VideoReviewShellProps {
  asset: Asset & {
    creator: User;
    annotations: (Annotation & { author: User })[];
    comments: (Comment & { author: User })[];
  };
}

// Adapt generic comments to VideoPlayer's expected format if needed, 
// strictly we should update CommentTimeline to use the new schema types.
// For now, mapping on the fly.
export function VideoReviewShell({ asset }: VideoReviewShellProps) {
  const videoRef = useRef<any>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(asset.duration || 0);

  // Map schema Comments to UI format
  const timelineComments = asset.comments.map(c => ({
    id: c.id,
    timestamp: c.timestamp || 0,
    content: c.content,
    isResolved: c.isResolved,
    author: {
      name: c.author.name,
      image: c.author.avatarUrl
    },
    createdAt: c.createdAt.toISOString()
  }));

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Viewer Area */}
      <div className="flex-1 flex items-center justify-center p-4 relative">
        <div className="max-w-5xl w-full aspect-video shadow-2xl bg-neutral-900 rounded-lg overflow-hidden border border-white/10 relative group">
           {/* No-Download Protection Overlay (Transparent) */}
           <div className="absolute inset-0 z-10" onContextMenu={e => e.preventDefault()} />
           
           <VideoPlayer
             ref={videoRef}
             src={asset.fileUrl} // Signed URL should be passed here
             className="w-full h-full"
             onTimeUpdate={setCurrentTime}
             onDurationChange={setDuration}
           />
        </div>
      </div>

      {/* Timeline Controls */}
      <div className="h-32 bg-neutral-900 border-t border-white/10 px-6 py-4">
        <div className="flex items-center justify-between mb-2">
           <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Timeline</h3>
           <span className="text-xs font-mono text-neutral-500">
             {Math.floor(currentTime)}s / {Math.floor(duration)}s
           </span>
        </div>
        
        <CommentTimeline
          duration={duration}
          currentTime={currentTime}
          comments={timelineComments}
          onSeek={(t) => videoRef.current?.seekTo(t)}
        />
      </div>
    </div>
  );
}
