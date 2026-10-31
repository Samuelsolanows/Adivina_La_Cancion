export interface Track {
  id: string;
  title: string;
  artists: string[];
  year: number;
  genres: string[];
  previewUrl?: string;
  spotifyUri?: string;
  coverUrl?: string;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  lives: number;
}

export interface GameConfig {
  difficulty: 'easy' | 'medium' | 'hard';
  fragmentDuration: number; // in seconds
  mode: 'millionaire' | 'last-man-standing' | 'points';
}

export interface Question {
  id: string;
  track: Track;
  options: Track[]; // Including the correct one
  correctTrackId: string;
}

export interface GameState {
  status: 'idle' | 'playing' | 'finished';
  currentQuestionIndex: number;
  players: Player[];
  config: GameConfig;
  history: Answer[];
}

export interface Answer {
  questionId: string;
  playerId: string;
  trackId: string;
  isCorrect: boolean;
  responseTime: number; // ms
}

export interface GameMode {
  name: string;
  init: (config: GameConfig, players: Player[]) => GameState;
  onAnswer: (state: GameState, answer: Answer) => GameState;
  onTimeout: (state: GameState) => GameState;
  isFinished: (state: GameState) => boolean;
}

export interface TrackProvider {
  name: string;
  fetchTracks: (criteria: any) => Promise<Track[]>;
  resolveTrack: (trackId: string) => Promise<Track>;
}

export interface AudioSource {
  resolveToClip: (track: Track) => Promise<string>; // URL to playable clip
  play: (url: string, start: number, duration: number) => Promise<void>;
}
