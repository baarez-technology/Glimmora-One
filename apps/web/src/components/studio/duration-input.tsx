'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Wand2 } from 'lucide-react';
import { resolveVideoSource } from '@/lib/video-source';
import { Input } from '@/components/ui/input';

type Props = {
  value: number; // seconds
  onChange: (seconds: number) => void;
  videoUrl?: string; // when set, exposes an "auto-detect" button
};

function toParts(total: number) {
  const t = Math.max(0, Math.floor(total || 0));
  return {
    h: Math.floor(t / 3600),
    m: Math.floor((t % 3600) / 60),
    s: t % 60,
  };
}

function fromParts(h: number, m: number, s: number) {
  return Math.max(0, Math.floor(h) * 3600 + Math.floor(m) * 60 + Math.floor(s));
}

// Probes a direct video URL with a hidden <video> element and reads
// .duration off `loadedmetadata`. For YouTube / Drive iframes this isn't
// possible without their respective APIs — caller should hide the button.
function probeDuration(url: string, timeoutMs = 8000): Promise<number | null> {
  return new Promise((resolve) => {
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.muted = true;
    v.style.position = 'fixed';
    v.style.left = '-9999px';
    let done = false;
    const finish = (val: number | null) => {
      if (done) return;
      done = true;
      try {
        v.src = '';
        v.remove();
      } catch {}
      resolve(val);
    };
    v.addEventListener('loadedmetadata', () => {
      const d = v.duration;
      if (typeof d === 'number' && isFinite(d) && d > 0) finish(Math.round(d));
      else finish(null);
    });
    v.addEventListener('error', () => finish(null));
    document.body.appendChild(v);
    v.src = url;
    setTimeout(() => finish(null), timeoutMs);
  });
}

export function DurationInput({ value, onChange, videoUrl }: Props) {
  const { h, m, s } = toParts(value);
  const [probing, setProbing] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const triedRef = useRef<string | null>(null);

  function update(part: 'h' | 'm' | 's', raw: string) {
    const n = Math.max(0, Math.min(part === 'h' ? 23 : 59, Number(raw) || 0));
    const next =
      part === 'h' ? fromParts(n, m, s) : part === 'm' ? fromParts(h, n, s) : fromParts(h, m, n);
    onChange(next);
  }

  async function autoDetect() {
    if (!videoUrl) return;
    const source = resolveVideoSource(videoUrl);
    if (source.kind !== 'direct') {
      setHint("Embeds can't auto-detect duration — enter it by hand.");
      return;
    }
    setProbing(true);
    setHint(null);
    const seconds = await probeDuration(videoUrl);
    setProbing(false);
    if (seconds && seconds > 0) {
      onChange(seconds);
      setHint(null);
    } else {
      setHint("Couldn't read the video metadata — enter it by hand.");
    }
  }

  // Auto-probe on first paste of a direct URL when duration is still 0.
  useEffect(() => {
    if (!videoUrl || value > 0) return;
    if (triedRef.current === videoUrl) return;
    triedRef.current = videoUrl;
    const source = resolveVideoSource(videoUrl);
    if (source.kind !== 'direct') return;
    autoDetect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoUrl]);

  const source = videoUrl ? resolveVideoSource(videoUrl) : null;
  const canAutoDetect = source?.kind === 'direct';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Input
            type="number"
            min={0}
            max={23}
            value={h || ''}
            onChange={(e) => update('h', e.target.value)}
            placeholder="hh"
            className="w-16 text-center"
          />
          <span className="text-muted">:</span>
          <Input
            type="number"
            min={0}
            max={59}
            value={m || ''}
            onChange={(e) => update('m', e.target.value)}
            placeholder="mm"
            className="w-16 text-center"
          />
          <span className="text-muted">:</span>
          <Input
            type="number"
            min={0}
            max={59}
            value={s || ''}
            onChange={(e) => update('s', e.target.value)}
            placeholder="ss"
            className="w-16 text-center"
          />
        </div>
        {videoUrl && canAutoDetect && (
          <button
            type="button"
            onClick={autoDetect}
            disabled={probing}
            className="text-[11px] text-glimmer-500 hover:underline disabled:opacity-40 inline-flex items-center gap-1"
          >
            {probing ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" /> Probing…
              </>
            ) : (
              <>
                <Wand2 className="h-3 w-3" /> Auto-detect
              </>
            )}
          </button>
        )}
      </div>
      {hint && <p className="text-[11px] text-muted">{hint}</p>}
    </div>
  );
}
