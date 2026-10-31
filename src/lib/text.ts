export function normalizeText(s: string): string {
  if (!s) return '';
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\(([^)]*)\)|\[([^\]]*)\]/g, '')
    .replace(/feat\.\s+.*|ft\.\s+.*|remastered|remasterizado|versión|version|live|en vivo|radio edit/gi, '')
    .replace(/\s*-\s*\d{4}\s*$/g, '')
    .replace(/[^\w\s]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function levenshteinDistance(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

export function isAcceptableAnswer(input: string, trackTitle: string): boolean {
  const normInput = normalizeText(input);
  const normTrack = normalizeText(trackTitle);
  const distance = levenshteinDistance(normInput, normTrack);

  if (normTrack.length === 0) return normInput.length === 0;

  const threshold = normTrack.length <= 4
    ? 1
    : Math.max(1, Math.floor(normTrack.length * 0.15));

  return distance <= threshold;
}

export function seededRng(seed: number) {
  let s = seed;
  return function() {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function shuffle<T>(array: T[], rng: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function isVariantTrack(track: { title: string; album?: string; artist: string | string[] }): { isVariant: boolean; reason?: string } {
  const check = (s: string) => {
    if (!s) return null;
    const lower = s.toLowerCase();
    if (lower.includes('karaoke')) return 'karaoke';
    if (lower.includes('tribute') || lower.includes('tributo')) return 'tribute';
    if (lower.includes('cover')) return 'cover';
    if (lower.includes('instrumental')) return 'instrumental';
    if (lower.includes('versión') || lower.includes('version')) return 'variant';
    if (lower.includes('live') || lower.includes('en vivo')) return 'live';
    return null;
  };

  const artistStr = Array.isArray(track.artist) ? track.artist.join(' ') : track.artist;
  const reason = check(track.title) || check(track.album || '') || check(artistStr);

  return {
    isVariant: !!reason,
    reason: reason || undefined
  };
}
