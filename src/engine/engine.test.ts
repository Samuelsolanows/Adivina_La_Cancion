import { describe, it, expect } from 'vitest';
import { normalizeText, isAcceptableAnswer, seededRng, isVariantTrack } from '../lib/text';
import { buildPool, generateQuestion } from './pool';
import { PointsMode } from './modes/points';
import type { Track, GameConfig } from './types';

describe('Text Utilities', () => {
  it('should normalize text correctly', () => {
    expect(normalizeText('Gotas de Lluvia (Remastered 2011)')).toBe('gotas de lluvia');
    expect(normalizeText('La Bicicleta - feat. Shakira')).toBe('la bicicleta');
    expect(normalizeText('Él Me Mintió - En Vivo')).toBe('el me mintio');
    expect(normalizeText('Niña Bonita')).toBe('nina bonita');
    expect(normalizeText('  Hello   World  ')).toBe('hello world');
  });

  it('should validate acceptable answers', () => {
    const title = 'La Bicicleta';
    expect(isAcceptableAnswer('la bicicleta', title)).toBe(true);
    expect(isAcceptableAnswer('la biciclet', title)).toBe(true); // 1 char diff, acceptable
    expect(isAcceptableAnswer('la bicicletaaaa', title)).toBe(false); // too long
    expect(isAcceptableAnswer('otra cosa', title)).toBe(false);
  });

  it('should detect variant tracks', () => {
    expect(isVariantTrack({ title: 'Song (Karaoke)', artist: 'Artist' }).isVariant).toBe(true);
    expect(isVariantTrack({ title: 'Song', artist: 'Artist', album: 'Tribute to...' }).isVariant).toBe(true);
    expect(isVariantTrack({ title: 'Song', artist: 'Artist' }).isVariant).toBe(false);
  });
});

describe('Pool Engine', () => {
  const mockTracks: Track[] = [
    { id: '1', title: 'T1', artists: ['A1'], year: 2012, genres: ['G1'], coverUrl: '' },
    { id: '2', title: 'T2', artists: ['A2'], year: 2013, genres: ['G1'], coverUrl: '' },
    { id: '3', title: 'T3', artists: ['A3'], year: 2014, genres: ['G1'], coverUrl: '' },
    { id: '4', title: 'T4', artists: ['A4'], year: 2015, genres: ['G1'], coverUrl: '' },
    { id: '5', title: 'T5', artists: ['A5'], year: 2000, genres: ['G1'], coverUrl: '' }, // Out of range
    { id: '6', title: 'T1', artists: ['A1'], year: 2012, genres: ['G1'], coverUrl: '' }, // Duplicate
  ];

  it('should filter pool by year and remove duplicates', () => {
    const rng = seededRng(123);
    const { pool, summary } = buildPool(mockTracks, { years: { start: 2010, end: 2015 } }, rng);
    expect(pool.length).toBe(4);
    expect(summary.discarded.year).toBe(1);
    expect(summary.discarded.duplicate).toBe(1);
  });

  it('should generate questions with valid distractors', () => {
    const rng = seededRng(123);
    const pool = mockTracks.slice(0, 4);
    const config: GameConfig = { difficulty: 'medium', fragmentDuration: 8, mode: 'points' };
    const q = generateQuestion(pool[0], pool, config, rng);

    expect(q.options.length).toBe(4);
    expect(q.options).toContain(pool[0]);
    expect(q.options.every(o => o.id !== pool[0].id || o === pool[0])).toBe(true);
  });
});

describe('Points Mode', () => {
  const config: GameConfig = { difficulty: 'medium', fragmentDuration: 8, mode: 'points' };
  const players = [{ id: 'p1', name: 'Player 1', score: 0, lives: 3, streak: 0, lastResponseTime: 0 }];

  it('should calculate points and streaks correctly', () => {
    let state = PointsMode.init(config, players);
    const answer: any = { isCorrect: true, responseTime: 4000 }; // 4s / 8s = 50% time remaining

    state = PointsMode.onAnswer(state, answer);

    // Base 100 * 1.5 (med) = 150.
    // Velocity: (4000/8000)*50 = 25.
    // Total: 175.
    expect(state.players[0].score).toBe(175);
    expect(state.players[0].streak).toBe(1);
  });

  it('should reset streak on wrong answer', () => {
    let state = PointsMode.init(config, players);
    const ans1: any = { isCorrect: true, responseTime: 1000 };
    const ans2: any = { isCorrect: false, responseTime: 1000 };

    state = PointsMode.onAnswer(state, ans1);
    expect(state.players[0].streak).toBe(1);
    state = PointsMode.onAnswer(state, ans2);
    expect(state.players[0].streak).toBe(0);
    expect(state.players[0].score).toBeGreaterThan(0);
  });
});

describe('Determinism', () => {
  it('should produce identical results for same seed', () => {
    const run = (seed: number) => {
      const rng = seededRng(seed);
      const tracks = [
        { id: '1', title: 'T1', artists: ['A1'], year: 2012, genres: ['G1'] },
        { id: '2', title: 'T2', artists: ['A2'], year: 2013, genres: ['G1'] },
        { id: '3', title: 'T3', artists: ['A3'], year: 2014, genres: ['G1'] },
        { id: '4', title: 'T4', artists: ['A4'], year: 2015, genres: ['G1'] },
      ];
      const { pool } = buildPool(tracks, {}, rng);
      const config: GameConfig = { difficulty: 'medium', fragmentDuration: 8, mode: 'points' };
      return generateQuestion(pool[0], pool, config, rng).options.map(o => o.id);
    };

    expect(run(42)).toEqual(run(42));
  });
});
