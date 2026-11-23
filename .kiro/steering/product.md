# Product Overview

**@kendew-agency/react-feedback-layer** (v0.4.0-rc.1) is a drop-in React component library for collecting contextual user feedback through positioned comments on any UI. Comments are grouped into feedback sessions.

## Core Features

- Positioned comments (click or drag on an overlay) with optional indicator boxes
- Session-based feedback: every comment belongs to a feedback session and a location
- Session lifecycle: `draft` → `confirmed` → `resolving` → `resolved`
- Comment lifecycle: `draft` → `published` → `resolved` (resolved can be reopened to `published`)
- One session can span several pages. Each page uses its own `CommentContextProvider` with a `locationId`
- Typed error codes and event hooks for comments and sessions
- Compound components with `asChild` support. TypeScript-first
- Minimal dependencies: React 18+ (peer), `@radix-ui/react-slot`, `@j31/tryx-handler`

## Key Use Cases

- Design review and collaboration tools
- Feedback rounds on prototypes (create, confirm, resolve a session)
- Bug reporting with visual context
- Annotation of content for review

## Domain Rules (see README "Core Concepts")

- A comment is visible only when its `sessionId` is the active session and its `locationId` equals the provider's `locationId`. Comments without `locationId` are hidden and ignored by session checks.
- A session needs a user to be created (`createSession({ user })`). There is no `UserProvider`.
- Session transitions are committed only after the consumer callback resolves (`onCreateSession`, `onConfirmSession`, `onStartResolving`, `onResolveSession`). On failure the status stays and `onError` receives the error.
- Draft comments exist only in a `draft` session. Resolve and reopen only work in a `resolving` session and need `canResolveSession`.
- `SessionType` is currently only `"feedback"`. `sourceSessionId` is reserved for a future rework session.
- 0.3.x consumers migrate via the README section "Migrating from 0.3.x".

## Architecture Philosophy

- Headless UI: logic and structure, no styling
- Compound component pattern
- Two context layers: session state (`FeedbackSessionProvider`) and per-location comment state (`CommentContextProvider`)
- Reducer pattern for predictable state updates
- Consumer owns persistence through callbacks. The library never talks to a backend
