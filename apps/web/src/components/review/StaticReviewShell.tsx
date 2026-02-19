'use client';

import { useState, useRef } from 'react';
import { Asset, Annotation, User, Comment } from '@prisma/client';
import { ZoomIn, ZoomOut, Move } from 'lucide-react';
import Image from 'next/image';

interface StaticReviewShellProps {
  asset: Asset & {
    creator: User;
    annotations: (Annotation & { author: User })[];
    comments: (Comment & { author: User })[];
  };
}

export function StaticReviewShell({ asset }: StaticReviewShellProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="flex flex-col h-full bg-neutral-950">
      {/* Toolbar */}
      <div className="h-12 border-b border-white/10 flex items-center px-4 gap-2 bg-neutral-900">
        <div className="flex items-center gap-1 bg-black/50 rounded-lg p-1">
          <button 
            onClick={() => setScale(s => Math.max(0.1, s - 0.1))}
            className="p-1.5 hover:bg-white/10 rounded text-neutral-400 hover:text-white"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-xs font-mono w-12 text-center">{Math.round(scale * 100)}%</span>
          <button 
            onClick={() => setScale(s => Math.min(3, s + 0.1))}
            className="p-1.5 hover:bg-white/10 rounded text-neutral-400 hover:text-white"
          >
            <ZoomIn size={16} />
          </button>
        </div>
        
        <div className="h-6 w-px bg-white/10 mx-2" />
        <div className="text-xs text-neutral-500">
          Double-click to add annotation (Coming Soon)
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing"
           onMouseDown={handleMouseDown}
           onMouseMove={handleMouseMove}
           onMouseUp={handleMouseUp}
           onMouseLeave={handleMouseUp}
      >
        <div 
          className="absolute origin-center transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          }}
        >
          {/* Asset Image */}
          {asset.fileUrl && (
            <div className="relative shadow-2xl">
              {/* Using standard img tag for untrusted remote URLs or optimization bypass */}
              <img 
                src={asset.fileUrl} 
                alt={asset.title}
                className="max-w-none pointer-events-none select-none"
                draggable={false}
              />
              
              {/* Annotations Overlay */}
              {asset.annotations.map(anno => (
                <div
                  key={anno.id}
                  className="absolute border-2 border-primary-500 bg-primary-500/10 hover:bg-primary-500/20 transition-colors group cursor-pointer"
                  style={{
                    left: `${(anno.x || 0) * 100}%`,
                    top: `${(anno.y || 0) * 100}%`,
                    width: `${(anno.width || 0) * 100}%`,
                    height: `${(anno.height || 0) * 100}%`,
                  }}
                >
                  <div className="absolute -top-6 left-0 bg-primary-500 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {anno.author.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
