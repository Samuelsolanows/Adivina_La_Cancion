# Audio Guessing Game (PWA)

A web-based game where users guess songs based on short audio fragments.

## Product Summary
- **Core Loop:** Users create a musical universe (genre, artist, years, or Spotify playlist) and guess songs by listening to clips.
- **Local Multiplayer:** Single-screen experience (turn-based or split-screen).
- **Game Modes:**
  - *Millionaire:* Escalating difficulty, safe levels, and lifelines (50/50, extend clip, hint, etc.).
  - *Last Man Standing:* Life-based survival.
  - *Points:* Speed and streak-based scoring.
- **Difficulty:** Based on fragment length (Easy: 15s, Medium: 8s, Hard: 3-5s).

## Architecture
- `src/engine/`: Pure business logic. **Strictly forbidden** to import from `ui`, `providers`, or `audio`. Must be 100% testable.
  - **Public API**:
    - `buildPool(tracks, filters, rng)`: Filters, deduplicates and shuffles tracks.
    - `generateQuestion(track, pool, config, rng)`: Creates a Question with distractors.
    - `PointsMode`: Implementation of `GameMode` for the points system.
    - `normalizeText(s)`: Cleans track titles for comparison.
    - `isAcceptableAnswer(input, track)`: Levenshtein-based answer validation.
- `src/providers/`: Integration with music APIs (Spotify, Deezer, etc.) via `TrackProvider` interface.
- `src/audio/`: Audio abstraction (`AudioSource` and player) to handle clip resolution and playback.
- `src/state/`: Global state management using Zustand.
- `src/ui/`: React components.
- `src/lib/`: Shared utilities (normalization, shuffling, caching).

## Conventions
- **TypeScript**: Strict mode enabled.
- **Determinism**: Use `seededRng` for all randomness.
- **State**: Zustand for lightweight, decoupled state.
- **Testing**: Vitest for engine logic.
- **PWA**: `vite-plugin-pwa` for installability.
- **Git Workflow**:
  - Branching: Use `feature/<name>` for new features.
  - Commits: Follow Conventional Commits (`feat`, `fix`, `test`, `docs`, `chore`, `refactor`).
  - Process: No direct commits to `main`. Use Pull Requests.
  - Security: Never commit secrets; use `.env` and verify before committing.


## Conventions
- **TypeScript:** Strict mode enabled.
- **State:** Zustand for lightweight, decoupled state.
- **Testing:** Vitest for engine logic.
- **PWA:** `vite-plugin-pwa` for installability.

## Useful Commands
- `npm run dev`: Start development server.
- `npm run build`: Build for production.
- `npm run test`: Run Vitest tests.
- `npm run lint`: Lint code.
- `npm run typecheck`: Run `tsc` for type validation.

## Open Risks
- **Audio Availability**: Spike completed. Hybrid strategy: iTunes for discovery (filters), Deezer for resolution (matching).
- **CORS/Proxy**: Deezer requires a proxy. The `api/` directory must be implemented as a serverless proxy.
- **URL Expiration**: Deezer URLs expire. Resolution must happen per-session.
- **Metadata Noise**: Years in Deezer are often album-release dates, not original track dates. iTunes is more reliable for year-filtering.

