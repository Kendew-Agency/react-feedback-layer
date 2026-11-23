# Project Structure

```
src/
├── components/   # Public components: comment, comment-overlay, comment-renderer,
│                 #   comment-actions (ToggleOverlayButton), session-actions
├── contexts/     # feedback-session-context, comment-context, scoped-comment
├── lib/          # use-comment-events, use-session-events, tx, to-known-error
├── types/        # *.types.ts (action, comment, error, event, overlay, session)
├── utils/        # session-reducer, session-guards, session-type,
│                 #   select-visible-comments, position, hasStatus
├── errors.ts     # BaseError subclasses with error codes
└── index.ts      # Main entry

playground/       # Vite dev app (not published)
├── app.tsx, main.tsx, index.html, vite.config.ts
├── components/   # router, button, event-listener
├── pages/        # page-a, page-b, page-c (multi-location demo)
└── features/comments/   # session-shell, comment-wrapper, db.ts (IndexedDB),
    └── _components/     #   server.ts (fake backend), private toolbar/list/comment

dist/             # Build output (gitignored)
```

Tests are `*.test.ts(x)` under `src/` or `playground/`, run by Vitest (jsdom).

## Naming Conventions

- Files: `kebab-case.ts(x)`. Types: `kebab-case.types.ts`. Config: `name.config.ts`
- Private feature components live in `_components/`
- Components and types `PascalCase`. Variables and functions `camelCase`. Constants `CONSTANT_CASE`

## Architecture

### Compound components
`Comment` exposes `Root`, `Indicator`, `Content`, `Edit`, `Confirm`, `Delete`, `Resolve`, `Reopen`. Components accept `asChild` via Radix Slot.

### Providers and hooks
- `FeedbackSessionProvider` and `useFeedbackSession()`: session state, `createSession`, `confirmSession`, `startResolving`, `resolveSession`, `resolveComment`, `reopenComment`. Session props: `initialSession`, `onCreateSession`, `onConfirmSession`, `onStartResolving`, `onResolveSession`, `onError`
- `CommentContextProvider` and `useComments()`: comments for one `locationId`, overlay state, visibility, `commentsBySession`. Callbacks: `onAdd`, `onEdit`, `onDelete`, `onResolve`, `onReopen`
- `CommentScopeContext` and `useCommentScope()`: scope of a single comment
- `useSessionBridge()` (internal) connects the comment provider to the session provider

### Reducers
- `commentReducer` (in `comment-context.tsx`) actions: `REGISTER`, `UPDATE_COMMENTS`, `APPEND_COMMENT`, `REPLACE_COMMENT`, `EDIT`, `DELETE`, `FOCUS`, `TOGGLE_OVERLAY`, `CHANGE_OVERLAYSTATE`, `UPDATE_VISIBILITY`
- `sessionReducer` (`utils/session-reducer.ts`) actions: `SESSION_CREATED`, `SESSION_CONFIRMED`, `SESSION_RESOLVING_STARTED`, `SESSION_RESOLVED`, `COMMENT_COMMITTED`, `COMMENT_STATUS_CHANGED`, `COMMENT_REMOVED`, `SET_OPERATION_STATE`
- Transition rules are guarded in `utils/session-guards.ts`. Visibility selection is in `utils/select-visible-comments.ts`

### Errors
Typed errors in `src/errors.ts` (for example `SessionStateError`, `PermissionError`, `SessionCreateError`) are mapped via `lib/to-known-error.ts` and reported through `onError`. Functions return `{ error }` instead of throwing.

## Export Strategy

- `/` from `src/index.ts`: components, `Comment`, `CommentContextProvider`, `useComments`, `useCommentScope`, `FeedbackSessionProvider`, `useFeedbackSession`, session action components, session provider types
- `/types` from `src/types/index.ts`: types only

## Build Outputs

`dist/index.{js,cjs,d.ts}` and `dist/types.{js,cjs,d.ts}`. `sideEffects: false`.

## Docs

`README.md` is the API reference, includes the changelog and the 0.3.x migration guide. Update it when public behavior changes.
