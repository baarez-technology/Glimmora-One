'use client';

import { useEffect, useRef } from 'react';
import { resolveVideoSource } from '@/lib/video-source';

type Props = {
  src: string;
  poster?: string | null;
  startAt?: number;
  onProgress?: (seconds: number, duration: number) => void;
  onEnded?: () => void;
};

// Renders one of three things depending on the URL:
//   - direct video file or HLS  → <video> tag (full progress tracking)
//   - YouTube watch / share URL → <iframe> (no progress events)
//   - Google Drive share URL    → <iframe> via /preview
//
// For embeds we skip onProgress / onEnded — the host doesn't expose those.
// The reflection prompt is still surfaced on the episode page, so customers
// can write a reflection manually after watching.
export function VideoPlayer({ src, poster, startAt = 0, onProgress, onEnded }: Props) {
  const source = resolveVideoSource(src);

  if (source.kind === 'youtube' || source.kind === 'drive') {
    return (
      <iframe
        src={source.embedUrl}
        className="w-full h-full bg-black rounded-lg"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    );
  }

  if (source.kind === 'invalid') {
    return (
      <div className="w-full h-full bg-black rounded-lg grid place-items-center text-muted">
        <p className="text-sm">This episode doesn't have a video yet.</p>
      </div>
    );
  }

  return (
    <DirectVideoPlayer
      src={source.src}
      poster={poster}
      startAt={startAt}
      onProgress={onProgress}
      onEnded={onEnded}
    />
  );
}

function DirectVideoPlayer({ src, poster, startAt = 0, onProgress, onEnded }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const lastReport = useRef(0);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    let hls: import('hls.js').default | null = null;
    let cancelled = false;

    async function attach() {
      const video = ref.current!;
      const isHls = /\.m3u8($|\?)/i.test(src);
      const canNative = video.canPlayType('application/vnd.apple.mpegurl');

      if (isHls && !canNative) {
        const Hls = (await import('hls.js')).default;
        if (cancelled) return;
        if (Hls.isSupported()) {
          hls = new Hls({ enableWorker: true });
          hls.loadSource(src);
          hls.attachMedia(video);
        } else {
          video.src = src;
        }
      } else {
        video.src = src;
      }

      if (startAt > 0) {
        const seek = () => {
          if (video.duration && video.duration > startAt) video.currentTime = startAt;
          video.removeEventListener('loadedmetadata', seek);
        };
        video.addEventListener('loadedmetadata', seek);
      }
    }
    attach();

    return () => {
      cancelled = true;
      hls?.destroy();
    };
  }, [src, startAt]);

  return (
    <video
      ref={ref}
      controls
      playsInline
      poster={poster ?? undefined}
      className="w-full h-full bg-black rounded-lg"
      onTimeUpdate={(e) => {
        const v = e.currentTarget;
        if (Math.abs(v.currentTime - lastReport.current) >= 10) {
          lastReport.current = v.currentTime;
          onProgress?.(v.currentTime, v.duration);
        }
      }}
      onEnded={onEnded}
    />
  );
}
