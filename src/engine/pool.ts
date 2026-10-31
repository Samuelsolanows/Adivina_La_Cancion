import type { Track, GameConfig, Question } from './types';
import { normalizeText, shuffle, isVariantTrack } from '../lib/text';

export interface PoolFilters {
  years?: { start: number; end: number };
  genres?: string[];
  artists?: string[];
  discardVariants?: boolean;
}

export interface PoolResult {
  pool: Track[];
  summary: {
    discarded: {
      year: number;
      genre: number;
      artist: number;
      variant: number;
      duplicate: number;
    };
    warning?: string;
  };
}

export function buildPool(tracks: Track[], filters: PoolFilters, rng: () => number): PoolResult {
  const summary = {
    discarded: { year: 0, genre: 0, artist: 0, variant: 0, duplicate: 0 },
    warning: undefined
  };

  const uniqueMap = new Map<string, Track>();

  for (const track of tracks) {
    // Year filter
    if (filters.years && (track.year < filters.years.start || track.year > filters.years.end)) {
      summary.discarded.year++;
      continue;
    }

    // Genre filter
    if (filters.genres && filters.genres.length > 0) {
      const hasGenre = track.genres.some(g => filters.genres!.includes(g));
      if (!hasGenre) {
        summary.discarded.genre++;
        continue;
      }
    }

    // Artist filter
    if (filters.artists && filters.artists.length > 0) {
      const hasArtist = track.artists.some(a => filters.artists!.includes(a));
      if (!hasArtist) {
        summary.discarded.artist++;
        continue;
      }
    }

    // Variant filter
    if (filters.discardVariants) {
      const { isVariant } = isVariantTrack({ title: track.title, album: '', artist: track.artists.join(' ') });
      if (isVariant) {
        summary.discarded.variant++;
        continue;
      }
    }

    // Deduplication (norm title + norm artist)
    const key = `${normalizeText(track.title)}|${track.artists.map(normalizeText).join(',')}`;
    if (uniqueMap.has(key)) {
      summary.discarded.duplicate++;
      continue;
    }

    uniqueMap.set(key, track);
  }

  const pool = shuffle(Array.from(uniqueMap.values()), rng);

  return { pool, summary };
}

export function generateQuestion(
  track: Track,
  pool: Track[],
  config: GameConfig,
  rng: () => number
): Question {
  const clipSeconds = {
    easy: 15,
    medium: 8,
    hard: 4
  }[config.difficulty];

  // Distractors: Same genre, similar decade, different artist/title
  const distractors = pool
    .filter(t => t.id !== track.id)
    .filter(t => {
      const sameArtist = t.artists.some(a => track.artists.includes(a));
      if (sameArtist) return false;
      return true;
    })
    .sort((a, b) => {
      // Prefer same genre
      const aGenre = a.genres.some(g => track.genres.includes(g)) ? 1 : 0;
      const bGenre = b.genres.some(g => track.genres.includes(g)) ? 1 : 0;
      if (aGenre !== bGenre) return bGenre - aGenre;
      // Prefer similar decade
      const aDecade = Math.abs(a.year - track.year);
      const bDecade = Math.abs(b.year - track.year);
      return aDecade - bDecade;
    })
    .slice(0, 3);

  const isDegraded = distractors.length < 3;

  // If not enough, fill with randoms from pool
  if (isDegraded) {
    const remaining = pool.filter(t => t.id !== track.id && !distractors.includes(t));
    const fillCount = 3 - distractors.length;
    const randomFill = shuffle(remaining, rng).slice(0, fillCount);
    distractors.push(...randomFill);
  }

  const options = shuffle([track, ...distractors], rng);

  return {
    id: `${track.id}-${Math.floor(rng() * 10000)}`,
    track,
    options,
    correctTrackId: track.id,
    clipSeconds,
    hint: `${track.year} | ${track.artists[0][0]}...`,
    isDegraded
  };
}
