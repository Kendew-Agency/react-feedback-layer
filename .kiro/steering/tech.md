# Technology Stack

## Core

- **React 18+** (peer: `react`, `react-dom` >= 18)
- **TypeScript 5.4+**, strict
- **tsup**: ESM + CJS + d.ts, entries `src/index.ts` and `src/types/index.ts`
- **Biome 2.x**: formatter and linter (no ESLint or Prettier)
- **Vitest 2** with jsdom, `@testing-library/react`, `fast-check` (property tests), `fake-indexeddb`
- Package is ESM (`"type": "module"`), published publicly to npm

## Runtime Dependencies

- `@radix-ui/react-slot`: `asChild` composition
- `@j31/tryx-handler`: error handling (`src/lib/tx.ts`)

## Dev Tools

- **Vite** + `@vitejs/plugin-react` serve the playground. **Sass** for playground styles
- Playground uses IndexedDB (`playground/features/comments/db.ts`) as a fake backend

## Commands

```bash
npm run dev                 # tsup watch build
npm run playground          # Vite dev server
npm run playground:build    # Build playground
npm run build               # Production build
npm test                    # vitest --run
npm run typecheck           # tsc --noEmit
npm run lint                # biome lint
npm run format              # biome format
npm run format-and-lint     # biome check (used in CI)
npm run format-and-lint:fix # biome check --write
npm run prepublishOnly      # typecheck + build
```

CI (`.github/workflows`): `biome.yaml`, `pr-build.yml`, `publish.yml`.

## TypeScript

- Target ES2020, Module ESNext, Bundler resolution, JSX `react-jsx`, no emit
- `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `useUnknownInCatchVariables` enabled
- With `exactOptionalPropertyTypes`, optional props that may receive `undefined` are typed `?: T | undefined`

## Code Style (Biome)

- 80 columns, 2-space indent, double quotes, semicolons, trailing commas `all`
- Run `npm run format-and-lint:fix` before finishing a change
- Before finishing: `npm run typecheck && npm test`

## Notes

- `.env.local`, `dist/` and `playground/dist/` are gitignored
