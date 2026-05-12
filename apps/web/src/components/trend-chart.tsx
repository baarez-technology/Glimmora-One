'use client';

import type { EmotionTrendPoint } from '@/lib/types';

const MOOD_COLOR: Record<string, string> = {
  sad: '#7390c2',
  anxious: '#e9a932',
  angry: '#c46a4c',
  joyful: '#f0c057',
  lonely: '#9f88c0',
  confused: '#a78b6b',
  hopeful: '#6fae7a',
  neutral: '#bfae93',
};

export function TrendChart({ points }: { points: EmotionTrendPoint[] }) {
  const max = Math.max(1, ...points.map((p) => p.intensity || 0), 10);
  return (
    <div className="flex items-end gap-1 h-32">
      {points.map((p, i) => {
        const h = (p.intensity / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <div
              className="w-full rounded-t transition-all"
              style={{
                height: `${Math.max(4, h)}%`,
                backgroundColor: p.mood ? MOOD_COLOR[p.mood] ?? MOOD_COLOR.neutral : 'rgba(120, 100, 80, 0.15)',
                opacity: p.count > 0 ? 1 : 0.4,
              }}
              title={`${p.date} · ${p.mood ?? 'no entry'} · intensity ${p.intensity}`}
            />
          </div>
        );
      })}
    </div>
  );
}
