'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactPlayer from 'react-player';
import * as fabric from 'fabric'; // v6/v7 import style, check version installed
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface VideoAnnotationPlayerProps {
    assetId: string;
    videoUrl: string;
    className?: string;
}

// Helper to merge classes
function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

export function VideoAnnotationPlayer({
    assetId,
    videoUrl,
    className,
}: VideoAnnotationPlayerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<ReactPlayer>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const requestRef = useRef<number>();

    // Initialize Fabric Canvas
    useEffect(() => {
        if (!canvasRef.current || fabricCanvasRef.current) return;

        // Use a fixed internal resolution for consistency, e.g., 1920x1080
        // We will scale it visually with CSS/Transform
        const baseWidth = 1920;
        const baseHeight = 1080;

        const canvas = new fabric.Canvas(canvasRef.current, {
            width: baseWidth,
            height: baseHeight,
            selection: true,
            renderOnAddRemove: true,
        });

        // Make canvas transparent
        canvas.backgroundColor = 'rgba(0,0,0,0)';

        // Example: Add a test rectangle to verify it works
        const rect = new fabric.Rect({
            left: 100,
            top: 100,
            fill: 'red',
            width: 200,
            height: 200,
            opacity: 0.5,
        });
        canvas.add(rect);

        fabricCanvasRef.current = canvas;

        return () => {
            canvas.dispose();
            fabricCanvasRef.current = null;
        };
    }, []);

    // Resize Observer for Responsive Scaling
    useEffect(() => {
        if (!containerRef.current || !fabricCanvasRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                const canvas = fabricCanvasRef.current;
                if (!canvas) return;

                // Determine scale based on our base resolution (1920x1080)
                // Assuming video aspect ratio is 16:9 for now. 
                // Real implementation should get video intrinsic dimensions.
                const baseWidth = 1920;

                const scale = width / baseWidth;

                // We set the dimensions of the wrapper element (canvas container)
                // AND apply a zoom to the fabric instance.
                canvas.setDimensions({ width, height });
                canvas.setZoom(scale);
                canvas.requestRenderAll();
            }
        });

        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    // Sync Loop (requestAnimationFrame)
    const syncLoop = useCallback(() => {
        if (!playerRef.current) return;

        // Get actual time from player
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);

        // TODO: Calculate bucket index and fetch/render annotations
        // const bucketIndex = Math.floor(time * 24); // 24 fps example

        if (isPlaying) {
            requestRef.current = requestAnimationFrame(syncLoop);
        }
    }, [isPlaying]);

    useEffect(() => {
        if (isPlaying) {
            requestRef.current = requestAnimationFrame(syncLoop);
        } else {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying, syncLoop]);


    return (
        <div
            ref={containerRef}
            className={cn("relative w-full aspect-video bg-black overflow-hidden", className)}
        >
            {/* Video Layer */}
            <ReactPlayer
                ref={playerRef}
                url={videoUrl}
                width="100%"
                height="100%"
                playing={isPlaying}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                controls={true}
                className="absolute top-0 left-0"
                style={{ pointerEvents: 'auto' }} // Ensure controls are clickable if z-index issues arise
            />

            {/* Canvas Layer - absolute overlay */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                {/* Pointer events none on wrapper so video controls work? 
            No, we need pointer events for drawing. 
            Strategy: Toggle "Drawing Mode" vs "Viewing Mode"? 
            Or just let canvas capture clicks and pass through if no object hit? 
            Fabric handles this well usually.
         */}
                <canvas ref={canvasRef} className="pointer-events-auto" />
            </div>

            {/* Debug Info */}
            <div className="absolute top-2 right-2 bg-black/50 text-white p-2 text-xs rounded pointer-events-none">
                Time: {currentTime.toFixed(2)}s
            </div>
        </div>
    );
}
