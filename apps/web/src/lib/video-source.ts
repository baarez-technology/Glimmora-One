// Detect how a creator-supplied video URL should be played. Three modes:
//   - direct: plain video file or HLS — use the <video> player
//   - youtube: render the YouTube iframe embed
//   - drive: render Google Drive's /preview iframe
//
// For iframe-based sources we lose timeupdate / ended events, so customer
// watch-progress tracking won't accrue for them. The reflection prompt is
// still rendered, so the user can write one manually after watching.

export type VideoSource =
  | { kind: 'direct'; src: string }
  | { kind: 'youtube'; embedUrl: string; videoId: string }
  | { kind: 'drive'; embedUrl: string; fileId: string }
  | { kind: 'invalid'; reason: string };

function parseYouTubeId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, '');
  if (host === 'youtu.be') {
    const id = url.pathname.slice(1).split('/')[0];
    return id || null;
  }
  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
    if (url.pathname === '/watch') return url.searchParams.get('v');
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts[0] === 'embed' && parts[1]) return parts[1];
    if (parts[0] === 'shorts' && parts[1]) return parts[1];
    if (parts[0] === 'live' && parts[1]) return parts[1];
  }
  return null;
}

function parseDriveFileId(url: URL): string | null {
  if (!url.hostname.endsWith('drive.google.com')) return null;
  const parts = url.pathname.split('/').filter(Boolean);
  const dIdx = parts.indexOf('d');
  if (dIdx >= 0 && parts[dIdx + 1]) return parts[dIdx + 1];
  if (parts[0] === 'open') return url.searchParams.get('id');
  return null;
}

export function resolveVideoSource(raw: string): VideoSource {
  if (!raw || !raw.trim()) return { kind: 'invalid', reason: 'empty' };
  const trimmed = raw.trim();
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { kind: 'invalid', reason: 'not a URL' };
  }
  const ytId = parseYouTubeId(url);
  if (ytId) {
    return {
      kind: 'youtube',
      videoId: ytId,
      embedUrl: `https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1&playsinline=1`,
    };
  }
  const driveId = parseDriveFileId(url);
  if (driveId) {
    return {
      kind: 'drive',
      fileId: driveId,
      embedUrl: `https://drive.google.com/file/d/${driveId}/preview`,
    };
  }
  return { kind: 'direct', src: trimmed };
}

export function videoSourceLabel(s: VideoSource): string {
  switch (s.kind) {
    case 'youtube':
      return 'YouTube — will play as an embedded video. Watch-progress tracking is unavailable for embeds.';
    case 'drive':
      return 'Google Drive — will play via Drive\'s embed (the file must be set to "anyone with the link"). Watch-progress tracking is unavailable for embeds.';
    case 'direct':
      return 'Direct video — Glimmora will track watch progress.';
    case 'invalid':
      return s.reason;
  }
}
