# Repository Guidelines

## Project Structure & Module Organization
- `src/`: React + TypeScript source. Entry is `src/main.tsx`; root layout in `src/App.tsx` with styles in `src/App.css` and global tokens in `src/index.css`.
- `src/components/game/`: Feature components (`GameBoard`, `Scoreboard`, `QuestionDialog`) that render the Jeopardy flow.
- `src/components/ui/`: UI primitives, including 8bit buttons in `ui/8bit/`.
- `src/hooks/`: Custom logic like `useJeopardyGame` for turn/score/tile state.
- `src/types/`: Shared TypeScript types (e.g., `game.ts`).
- `src/data/`: Game content such as `questions.json`.
- `public/`: Static assets (fonts, `vite.svg`).
- Config: Vite (`vite.config.ts`), TypeScript (`tsconfig*.json`), Tailwind (`tailwind.config.js`), ESLint (`eslint.config.js`).

## Build, Test, and Development Commands
- `npm run dev` — Start Vite dev server with HMR.
- `npm run build` — Type-check (`tsc -b`) then create production build.
- `npm run preview` — Serve the production build locally.
- `npm run lint` — Run ESLint across the repo.

## Coding Style & Naming Conventions
- Language: TypeScript + React function components.
- Styles: Tailwind utilities plus scoped CSS modules like `src/App.css`; keep the pixel/dungeon aesthetic consistent.
- Naming: Components PascalCase (`QuestionDialog.tsx`), hooks camelCase (`useJeopardyGame`), CSS classes kebab-case if added.
- Imports: Use path alias `@/` for `src/` (configured in `tsconfig.json`).
- Formatting: 2-space indentation; rely on ESLint for consistency.

## Testing Guidelines
- No automated tests yet; validate changes with `npm run build` and `npm run lint`.
- If adding tests (e.g., Vitest), colocate as `ComponentName.test.tsx` near the source.

## Commit & Pull Request Guidelines
- Commits: Use clear, imperative summaries (e.g., “Refactor board into GameBoard component”) and keep related changes together.
- Pull Requests: Describe the change, note UI impacts (screenshots/GIFs welcome), list validation commands, and link issues if applicable.
- Keep diffs small and focused; update docs or config when behavior changes.

## Security & Configuration Tips
- No secrets should be committed. Environment-specific values belong in `.env` (not tracked). Vite exposes variables prefixed with `VITE_`.
- Dependencies are local; avoid adding network-installed binaries to source. Use `npm ci` in automation for deterministic installs.
