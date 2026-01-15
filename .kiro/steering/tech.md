# Technology Stack

## Core Technologies

- **React 18+** - Peer dependency, minimum version required
- **TypeScript 5.4+** - Strict mode enabled with enhanced type safety
- **tsup** - Build tool for bundling library (ESM + CJS outputs)
- **Biome** - Unified formatter and linter (replaces ESLint + Prettier)

## Dependencies

- `@radix-ui/react-slot` - Polymorphic component composition
- `@j31/tryx-handler` - Error handling utility

## Development Tools

- **Vite** - Development server for playground
- **Sass** - CSS preprocessing for playground styles
- **TypeScript** - Type checking with strict configuration

## Build System

The project uses **tsup** for building the library with dual output formats:

- ESM (`.js`) - Modern module format
- CJS (`.cjs`) - CommonJS for compatibility
- Type definitions (`.d.ts`) - Full TypeScript support

### Entry Points

- `src/index.ts` - Main library exports
- `src/types/index.ts` - Separate types export (`/types` subpath)

## Common Commands

```bash
# Development
npm run dev              # Watch mode build
npm run playground       # Start Vite dev server for testing

# Building
npm run build            # Production build
npm run playground:build # Build playground

# Code Quality
npm run typecheck        # TypeScript type checking
npm run lint             # Biome linting
npm run format           # Biome formatting
npm run format-and-lint:fix  # Auto-fix formatting and linting issues

# Publishing
npm run prepublishOnly   # Runs typecheck + build before publish
```

## TypeScript Configuration

- **Target**: ES2020
- **Module**: ESNext with Bundler resolution
- **Strict mode**: Enabled with additional safety checks
  - `noUncheckedIndexedAccess: true`
  - `exactOptionalPropertyTypes: true`
  - `useUnknownInCatchVariables: true`
- **JSX**: `react-jsx` (automatic runtime)
- **No emit**: Build handled by tsup

## Code Quality Standards

Biome is configured with:
- 80 character line width
- 2-space indentation
- Double quotes for strings
- Semicolons required
- Trailing commas enforced
- Strict naming conventions (PascalCase for types/components, camelCase for variables)
