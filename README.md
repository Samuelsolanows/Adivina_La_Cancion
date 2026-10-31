# Audio Guessing Game (PWA)

A web-based game where users guess songs based on short audio fragments.

## 🚀 Features
- Create musical universes (genre, artist, years, or Spotify playlists).
- Multiple game modes: Millionaire, Last Man Standing, and Points.
- Adjustable difficulty based on audio clip length.
- Local multiplayer experience.

## 🛠️ Tech Stack
- **Frontend:** React, TypeScript, Vite.
- **State Management:** Zustand.
- **Styling:** Tailwind CSS.
- **Audio:** Deezer/iTunes hybrid strategy.
- **PWA:** `vite-plugin-pwa`.
- **Testing:** Vitest.

## 📦 Installation & Setup
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`.
4. Start the development server:
   ```bash
   npm run dev
   ```

## 📜 Available Scripts
- `npm run dev`: Start development server.
- `npm run build`: Build for production.
- `npm run test`: Run Vitest tests.
- `npm run lint`: Lint code.
- `npm run typecheck`: Run `tsc` for type validation.

## 📁 Project Structure
- `src/engine/`: Core game logic (pure, testable).
- `src/providers/`: Music API integrations (Spotify, Deezer).
- `src/audio/`: Audio playback and resolution logic.
- `src/state/`: Global state management.
- `src/ui/`: React components.
- `src/lib/`: Shared utilities.
- `api/`: Serverless proxy for API requests.

## 📈 Current Status
- [x] Game Engine core logic.
- [x] Audio sourcing spike.
- [ ] Game Mode implementations.
- [ ] UI/UX development.
- [ ] PWA configuration.
