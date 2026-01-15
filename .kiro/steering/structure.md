# Project Structure

## Directory Organization

```
src/
├── components/       # React components (public API)
├── contexts/         # React context providers and hooks
├── lib/              # Utility libraries
├── types/            # TypeScript type definitions
├── utils/            # Helper functions
└── index.ts          # Main entry point

playground/           # Development testing environment
├── components/       # Playground-specific components
├── features/         # Feature demonstrations
│   └── comments/     # Comment system example
│       └── _components/  # Private feature components
├── index.html        # Vite entry HTML
├── main.tsx          # Playground app entry
└── vite.config.ts    # Vite configuration

dist/                 # Build output (gitignored)
```

## Naming Conventions

### Files
- **Components**: `kebab-case.tsx` or `PascalCase.tsx`
- **Utilities**: `kebab-case.ts`
- **Types**: `kebab-case.types.ts`
- **Config files**: `kebab-case.config.ts`

### Private Components
- Prefix with underscore: `_components/` for feature-internal components

### Code
- **Components/Functions**: `PascalCase` or `camelCase`
- **Variables**: `camelCase`, `PascalCase`, or `CONSTANT_CASE`
- **Types/Interfaces**: `PascalCase`

## Component Architecture

### Compound Component Pattern
Components use the compound component pattern for composition:

```tsx
export const Comment = {
  Root: CommentRoot,
  Indicator: CommentIndicator,
  Content: CommentContent,
  Edit: CommentEdit,
  Confirm: CommentConfirm,
  Delete: CommentDelete,
  Resolve: CommentResolve,
};
```

### Polymorphic Components
Components support `asChild` prop via Radix UI Slot for rendering as different elements while preserving functionality.

### Context-Based State
- `CommentContext` - Global comment state and actions
- `CommentScopeContext` - Scoped state for individual comments
- Custom hooks: `useComments()`, `useCommentScope()`

## State Management

Uses React's `useReducer` for predictable state updates with action types:
- `REGISTER` - Create new comment
- `UPDATE_COMMENTS` - Sync external updates
- `DELETE` - Remove comment
- `EDIT` - Update comment content/status
- `FOCUS` - Set active comment
- `TOGGLE_OVERLAY` - Show/hide overlay
- `CHANGE_OVERLAYSTATE` - Update overlay state
- `UPDATE_VISIBILITY` - Toggle comment visibility filters

## Export Strategy

### Main Entry (`/`)
Exports all public components, contexts, and hooks from `src/index.ts`

### Types Entry (`/types`)
Separate export for TypeScript types from `src/types/index.ts`

## Build Outputs

- `dist/index.js` - ESM bundle
- `dist/index.cjs` - CommonJS bundle
- `dist/index.d.ts` - Type definitions
- `dist/types.js` - Types ESM bundle
- `dist/types.cjs` - Types CommonJS bundle
- `dist/types.d.ts` - Types definitions

## Key Patterns

1. **Headless UI** - No default styling, full customization
2. **Compound Components** - Flexible composition
3. **Context + Reducer** - Centralized state management
4. **TypeScript-first** - Full type safety
5. **Dual Format** - ESM + CJS for compatibility
