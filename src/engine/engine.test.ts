import { expect, test } from 'vitest';
import type { GameConfig } from './types';

test('GameConfig basic structure', () => {
  const config: GameConfig = {
    difficulty: 'medium',
    fragmentDuration: 8,
    mode: 'points'
  };
  expect(config.difficulty).toBe('medium');
});
