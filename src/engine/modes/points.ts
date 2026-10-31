import type { GameMode } from '../types';

export const PointsMode: GameMode = {
  name: 'Points',

  init: (config, players) => ({
    status: 'playing',
    currentQuestionIndex: 0,
    players: players.map(p => ({ ...p, score: 0, streak: 0, lastResponseTime: 0 })),
    config,
    history: [],
    currentPlayerIndex: 0,
  }),

  onAnswer: (state, answer) => {
    const { players, config, currentPlayerIndex } = state;
    const player = { ...players[currentPlayerIndex] };

    if (answer.isCorrect) {
      // Base points
      let points = 100;

      // Difficulty multiplier
      const multipliers = { easy: 1, medium: 1.5, hard: 2 };
      points *= multipliers[config.difficulty];

      // Velocity bonus (Assuming 15s is max for easy, 8s medium, 4s hard)
      const maxTime = { easy: 15000, medium: 8000, hard: 4000 }[config.difficulty];
      const timeRemaining = Math.max(0, maxTime - answer.responseTime);
      const velocityBonus = (timeRemaining / maxTime) * 50;
      points += velocityBonus;

      // Streak bonus (+10% per hit, max +50%)
      const streakBonus = Math.min(0.5, player.streak * 0.1);
      points *= (1 + streakBonus);

      player.score += Math.round(points);
      player.streak += 1;
    } else {
      player.streak = 0;
    }

    player.lastResponseTime = answer.responseTime;

    const newPlayers = [...players];
    newPlayers[currentPlayerIndex] = player;

    return {
      ...state,
      players: newPlayers,
      currentPlayerIndex: (currentPlayerIndex + 1) % players.length,
      currentQuestionIndex: state.currentQuestionIndex + 1,
      history: [...state.history, answer],
    };
  },

  onTimeout: (state) => {
    const { players, currentPlayerIndex } = state;
    const player = { ...players[currentPlayerIndex] };
    player.streak = 0;

    const newPlayers = [...players];
    newPlayers[currentPlayerIndex] = player;

    return {
      ...state,
      players: newPlayers,
      currentPlayerIndex: (currentPlayerIndex + 1) % players.length,
      currentQuestionIndex: state.currentQuestionIndex + 1,
      history: [...state.history, {
        questionId: 'timeout',
        playerId: player.id,
        trackId: '',
        isCorrect: false,
        responseTime: 0
      }],
    };
  },

  isFinished: (state) => {
    // Define end condition: e.g., 10 questions per player
    return state.currentQuestionIndex >= state.players.length * 10;
  }
};
