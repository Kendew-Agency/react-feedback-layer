# @kendew-agency/react-feedback-layer

A drop-in React feedback layer for collecting contextual user feedback through interactive comments and annotations. Perfect for design review tools, bug reporting systems, and collaborative annotation platforms.

Have a look at the [changelog](#changelog) and the [migration guide](#migrating-from-03x) when updating the package.

## Features

- 🎯 **Contextual Feedback** - Click or drag to create comments anywhere on your UI
- 🗂️ **Feedback Sessions** - Group comments in a session that moves from draft to confirmed, resolving and resolved
- 💬 **Comment Lifecycle** - Draft → Published → Resolved, with reopen support
- 👥 **User Attribution** - Track who created each comment with timestamps
- 🎨 **Fully Customizable** - Headless UI with complete styling control
- 📦 **TypeScript First** - Full type definitions included
- ⚡ **Minimal Dependencies** - Only React 18+ and Radix UI Slot
- 🔧 **Compound Components** - Flexible composition patterns
- 🎪 **Visual Indicators** - Highlight specific UI areas with selection boxes
- 🔄 **Real-time Sync** - Optional subscription support for live updates

## Installation

```bash
npm install @kendew-agency/react-feedback-layer
```

### Peer Dependencies

This package requires React 18 or higher:

```bash
npm install react react-dom
```

## Quick Start

`CommentContextProvider` must be rendered inside a `FeedbackSessionProvider`. The session provider owns the session and its callbacks. The comment provider owns the individual comments and their callbacks.

```tsx
import {
  Comment,
  CommentContextProvider,
  CommentOverlay,
  CommentRenderer,
  ConfirmSession,
  CreateSession,
  FeedbackSessionProvider,
  ResolveSession,
  StartResolving,
  ToggleOverlayButton,
} from '@kendew-agency/react-feedback-layer';

function App({ isReviewer }: { isReviewer: boolean }) {
  return (
    <FeedbackSessionProvider
      canResolveSession={isReviewer}
      onCreateSession={async ({ type, user, projectId }) => {
        // Persist the session and return it. The returned status is ignored,
        // a new session always starts as a draft.
        return api.createSession({ type, user, projectId });
      }}
      onConfirmSession={(sessionId, type) => api.confirmSession(sessionId)}
      onStartResolving={(sessionId) => api.startResolving(sessionId)}
      onResolveSession={(sessionId) => api.resolveSession(sessionId)}
      onError={(error) => console.error(error.code, error.message)}
    >
      <CommentContextProvider
        currentUser={{ name: 'John Doe', id: 'user-123' }}
        onAdd={(comment) => api.addComment(comment)}
        onEdit={(comment) => api.editComment(comment)}
        onDelete={(commentId) => api.deleteComment(commentId)}
        onResolve={(comment) => api.resolveComment(comment)}
        onReopen={(comment) => api.reopenComment(comment)}
        onError={(error) => console.error(error.code, error.message)}
      >
        <CreateSession user={{ name: 'John Doe', id: 'user-123' }}>Start feedback session</CreateSession>
        <ConfirmSession>Confirm session</ConfirmSession>
        <StartResolving>Start resolving</StartResolving>
        <ResolveSession>Resolve session</ResolveSession>
        <ToggleOverlayButton>Toggle comments</ToggleOverlayButton>

        <CommentOverlay>
          <YourContent />
          <CommentRenderer
            Comment={YourCommentComponent}
            DraftComment={YourDraftComponent}
            ResolvedComment={YourResolvedComponent}
          />
        </CommentOverlay>
      </CommentContextProvider>
    </FeedbackSessionProvider>
  );
}
```

## Core Concepts

### Feedback Sessions

Every comment belongs to a feedback session. Only the comments of the active session (`comment.sessionId === session.id`) are visible. Without a session no comment is shown and no comment can be added.

#### Session flow

1. **Create the session.** Call `createSession({ user })` (or render `<CreateSession user={user} />`). The provider calls `onCreateSession`, stores the returned session as a `draft` and emits `onSessionCreated`.
2. **Add draft comments.** While the session is a `draft`, click or drag on the overlay to register a comment, write content and confirm it with `Comment.Confirm`. Confirming a comment calls `onAdd` and turns the comment from `draft` into `published`. Published comments can be edited (`onEdit`) and deleted (`onDelete`) as long as the session is a `draft`.
3. **Confirm the session.** Call `confirmSession()` (or render `<ConfirmSession />`). It calls `onConfirmSession(sessionId, type)`, sets `confirmedAt` and emits `onSessionConfirmed`. It is refused with a `SessionStateError` when the session is not a draft, when a local draft comment still exists, or when the session has no comments.
4. **Start resolving.** Call `startResolving()` (or render `<StartResolving />`). It calls `onStartResolving(sessionId)` and emits `onSessionResolving`. Requires `canResolveSession` and a `confirmed` session.
5. **Resolve comments.** While the session is `resolving`, resolve each published comment with `resolveComment(id)` or `<Comment.Resolve />`, and reopen resolved comments with `reopenComment(id)` or `<Comment.Reopen />`. Requires `canResolveSession`.
6. **Resolve the session.** Call `resolveSession()` (or render `<ResolveSession />`). It calls `onResolveSession(sessionId)`, sets `resolvedAt` and emits `onSessionResolved`. Requires `canResolveSession`, a `resolving` session and no comment that is still `published`.

#### Session status

`Session_Status` is `"draft" | "confirmed" | "resolving" | "resolved"`.

| From | To | Triggered by | Requires |
|------|----|--------------|----------|
| (none) | `draft` | `createSession()` | No other draft session, `onCreateSession` provided |
| `draft` | `confirmed` | `confirmSession()` | No local draft comments, at least one comment |
| `confirmed` | `resolving` | `startResolving()` | `canResolveSession` |
| `resolving` | `resolved` | `resolveSession()` | `canResolveSession`, no `published` comment left |

No other transitions exist. A transition is committed only after its callback resolves. When the callback throws or rejects, the status stays as it was and `onError` receives the error.

What each status allows:

| Status | Add, edit, delete comments | Resolve, reopen comments |
|--------|----------------------------|--------------------------|
| `draft` | Yes | No |
| `confirmed` | No | No |
| `resolving` | No | Yes, with `canResolveSession` |
| `resolved` | No | No |

Calls that are not allowed return `{ error }` with a `SessionStateError` and call `onError`. Calls without permission return a `PermissionError`.

### Comment Lifecycle

Comments have three statuses:

1. **Draft** - Newly created and only held locally. It is not persisted yet.
2. **Published** - Persisted through `onAdd` (or `onEdit` for later edits).
3. **Resolved** - Resolved through `onResolve`. A resolved comment can be reopened through `onReopen`, which turns it back into `published` and removes `resolvedAt`.

Draft comments exist only in a `draft` session. Resolving and reopening only work in a `resolving` session.

### Headless UI Architecture

This library provides the logic and structure without imposing any styling. You have complete control over how comments look and behave by providing your own component implementations.

### Compound Component Pattern

The `Comment` component uses a compound pattern for maximum flexibility:

```tsx
<Comment.Root comment={comment}>
  <Comment.Indicator />
  <Comment.Content />
  <Comment.Edit />
  <Comment.Confirm />
  <Comment.Delete />
  <Comment.Resolve />
  <Comment.Reopen />
</Comment.Root>
```

## Complete API Reference

### Components

#### `FeedbackSessionProvider`

Owns the active session and the session transitions. It must wrap `CommentContextProvider`.

**Props:**

```tsx
type FeedbackSessionProviderProps = {
  children: ReactNode;

  // Resume a session, for example after a reload
  initialSession?: InitialFeedbackSession;

  // Default project id passed to onCreateSession (1 to 128 characters)
  projectId?: string;

  // Whether the current user may start resolving, resolve the session,
  // and resolve and reopen comments. Default: false
  canResolveSession?: boolean;

  // Persist a new session. The returned status is ignored, it starts as a draft.
  onCreateSession?: (input: CreateSessionInput) => Promise<FeedbackSession>;

  // Persist the confirmation of the session
  onConfirmSession?: (sessionId: string, type: SessionType) => Promise<void>;

  // Persist the start of the resolution
  onStartResolving?: (sessionId: string) => Promise<void>;

  // Persist the resolution of the session
  onResolveSession?: (sessionId: string) => Promise<void>;

  // Receives every error that the provider produces
  onError?: (error: KnownError) => void;
};

type CreateSessionInput = {
  type: SessionType; // "feedback"
  user: User;
  projectId?: string | undefined;
};
```

`createSession` is refused when `user` is missing, when `onCreateSession` is not provided, when a draft session already exists, when a creation is in progress, or when `projectId` is not 1 to 128 characters long.

`initialSession` must have a valid `status`. Otherwise the provider starts without a session and reports a `SessionStateError` once on mount. Its `comments` are optional and default to an empty array.

**Example:**

```tsx
<FeedbackSessionProvider
  initialSession={savedSession}
  canResolveSession={user.role === 'reviewer'}
  onCreateSession={api.createSession}
  onConfirmSession={(id) => api.confirmSession(id)}
  onStartResolving={(id) => api.startResolving(id)}
  onResolveSession={(id) => api.resolveSession(id)}
  onError={handleError}
>
  {children}
</FeedbackSessionProvider>
```

#### `CommentContextProvider`

The provider that manages comment state and comment actions. It throws when it is not rendered inside a `FeedbackSessionProvider`. Standalone use is no longer possible.

**Props:**

```tsx
type CommentOverlayProps = {
  // Comments to start with. Defaults to the comments of the session.
  // Each comment needs a sessionId equal to the initialSession id.
  initialComments?: ConfirmedComment[];

  // Current logged-in user (default: null).
  currentUser?: User | null;

  children: ReactNode;

  // Initial overlay state (default: "inactive")
  initialOverlayState?: "idle" | "editing" | "saving" | "resolving" | "inactive";

  // Optional real-time subscription (beta)
  subscription?: {
    subscribe: (onUpdate: (comment: CommentType) => void) => void;
    unsubscribe: () => void;
  };

  // Persist a newly added comment
  onAdd?: (comment: ConfirmedComment) => Promise<void>;

  // Persist an edited comment
  onEdit?: (comment: ConfirmedComment) => Promise<void>;

  // Persist a resolved comment
  onResolve?: (comment: ConfirmedComment) => Promise<void>;

  // Persist a reopened comment
  onReopen?: (comment: ConfirmedComment) => Promise<void>;

  // Delete a persisted comment
  onDelete?: (commentId: string) => Promise<void>;

  // Receives every error that the provider produces
  onError?: (error: KnownError) => void;

  // Optional configuration for the comment layer
  config?: Config;

  // Optional project ID attached to every new comment
  projectId?: string;
};
```

| Callback | Called when | Receives |
|----------|-------------|----------|
| `onAdd` | A draft comment is confirmed | The comment with status `published` |
| `onEdit` | A published comment gets new content | The updated comment with status `published` |
| `onDelete` | A published comment is deleted | The comment id |
| `onResolve` | A published comment is resolved | The comment with status `resolved` and `resolvedAt` |
| `onReopen` | A resolved comment is reopened | The comment with status `published` and no `resolvedAt` |

Every callback is optional. When a callback throws or rejects, the change is not applied and `onError` receives an `AddError`, `EditError`, `DeleteError`, `ResolveError` or `ReopenError`. Deleting a local draft does not call `onDelete`.

**Example:**

```tsx
<CommentContextProvider
  currentUser={{ name: 'Jane Smith', id: '456', avatar: '/avatar.jpg' }}
  initialComments={existingComments}
  projectId="proj_123456789"
  onAdd={(comment) => api.addComment(comment)}
  onResolve={(comment) => api.resolveComment(comment)}
  onReopen={(comment) => api.reopenComment(comment)}
  onError={(error) => toast.error(error.message)}
  initialOverlayState="idle"
  config={{
    idPrefix: 'proj_',
    indicatorVisibility: 'active',
    draftVisibility: 'visible',
    commentVisibility: { hideResolved: false },
  }}
>
  {children}
</CommentContextProvider>
```

#### `CommentOverlay`

Creates an interactive overlay for adding comments via click or drag selection.

**Props:**

```tsx
interface CommentOverlayProps extends HTMLProps<HTMLDivElement> {
  children: ReactNode;
}
```

**Behavior:**

- **Click** - Creates a comment at the clicked position
- **Drag** - Creates a comment with a visual indicator box
- **Inactive State** - Renders children without overlay when `overlayState === "inactive"`
- **Session state** - Comments can only be created while the session is a `draft`. Otherwise `onError` receives a `SessionStateError`.

**Example:**

```tsx
<CommentOverlay>
  <div>Your annotatable content</div>
  <CommentRenderer {...} />
</CommentOverlay>
```

#### `CommentRenderer`

Renders all visible comments based on their status. Resolved comments are skipped when `config.commentVisibility.hideResolved` is `true`.

**Props:**

```tsx
interface CommentRendererProps {
  // Component for published comments
  Comment: ElementType<{ comment: CommentType }>;

  // Component for draft comments
  DraftComment: ElementType<{ comment: CommentType }>;

  // Component for resolved comments
  ResolvedComment: ElementType<{ comment: CommentType }>;
}
```

**Example:**

```tsx
<CommentRenderer
  Comment={PublishedComment}
  DraftComment={DraftComment}
  ResolvedComment={ResolvedComment}
/>
```

#### `Comment` (Compound Component)

A collection of sub-components for building custom comment UIs.

##### `Comment.Root`

Container for a single comment with positioning and active state management.

**Props:**

```tsx
interface CommentRootProps extends HTMLProps<HTMLDivElement> {
  comment: CommentType;
  defaultDraft?: string; // Initial draft content
  withPosition?: boolean; // Apply absolute positioning from comment.position (default: true)
  children?: ReactNode;
}
```

**Example:**

```tsx
<Comment.Root comment={comment} className="comment-card">
  {/* Sub-components */}
</Comment.Root>
```

**Rendering without positioning (e.g. in a list):**

Set `withPosition={false}` to skip the `position`, `top` and `left` styles derived from `comment.position`. Styles passed via `style` are still applied.

```tsx
<Comment.Root comment={comment} withPosition={false}>
  {/* Sub-components */}
</Comment.Root>
```

##### `Comment.Indicator`

Visual indicator showing the area a comment refers to (when created via drag).

**Props:**

```tsx
interface CommentIndicatorProps extends HTMLProps<HTMLDivElement> {}
```

**Example:**

```tsx
<Comment.Indicator className="highlight-box" />
```

##### `Comment.Content`

Displays the comment text content.

**Props:**

```tsx
interface CommentContentProps extends HTMLProps<HTMLParagraphElement> {
  asChild?: boolean; // Use Radix Slot for custom element
}
```

**Example:**

```tsx
<Comment.Content className="comment-text" />
```

##### `Comment.Edit`

Textarea for editing comment content.

**Props:**

```tsx
interface CommentEditProps extends HTMLProps<HTMLTextAreaElement> {
  asChild?: boolean;
}
```

**Example:**

```tsx
<Comment.Edit 
  className="comment-input"
  placeholder="Write your feedback..."
/>
```

##### `Comment.Confirm`

Button to save/confirm comment changes.

**Props:**

```tsx
interface CommentConfirmProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}
```

**Example:**

```tsx
<Comment.Confirm className="btn-primary">
  Save Comment
</Comment.Confirm>
```

##### `Comment.Delete`

Button to delete a comment.

**Props:**

```tsx
interface CommentDeleteProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}
```

**Example:**

```tsx
<Comment.Delete className="btn-danger">
  Delete
</Comment.Delete>
```

##### `Comment.Resolve`

Button that resolves the comment. It calls `resolveComment(comment.id)`, which needs a `resolving` session and `canResolveSession`. It renders nothing (and logs an error) for draft and resolved comments.

**Props:**

```tsx
interface CommentResolveProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}
```

**Example:**

```tsx
<Comment.Resolve className="btn-resolve">
  Mark as Resolved
</Comment.Resolve>
```

##### `Comment.Reopen`

Button that reopens a resolved comment. It calls `reopenComment(comment.id)`, with the same requirements as `Comment.Resolve`. It renders nothing (and logs an error) for draft and published comments.

```tsx
<Comment.Reopen className="btn-reopen">Reopen</Comment.Reopen>
```

Hide both buttons for users that may not resolve by reading `canResolve` from `useComments()`:

```tsx
function PublishedComment({ comment }) {
  const { canResolve } = useComments();
  return (
    <Comment.Root comment={comment}>
      <Comment.Content />
      {canResolve && <Comment.Resolve>Resolve</Comment.Resolve>}
    </Comment.Root>
  );
}
```

#### Action Components

All action components accept button props and `asChild`. They call the matching action and then your own `onClick`. The result of the action is not exposed, so use the hooks when you need it.

##### `ToggleOverlayButton`

Toggles the comment overlay on/off. Sets `data-active` when the overlay is not inactive.

```tsx
<ToggleOverlayButton className="toggle-btn">
  Toggle Comments
</ToggleOverlayButton>
```

##### `CreateSession`, `ConfirmSession`, `StartResolving`, `ResolveSession`

Call `createSession({ user })`, `confirmSession()`, `startResolving()` and `resolveSession()` of `useFeedbackSession()`. They must be rendered inside a `FeedbackSessionProvider`.

```tsx
<CreateSession user={currentUser}>New session</CreateSession>
<ConfirmSession>Confirm</ConfirmSession>
<StartResolving>Start resolving</StartResolving>
<ResolveSession>Finish</ResolveSession>
```

### Hooks

#### `useFeedbackSession()`

Access the session and its actions. Throws outside a `FeedbackSessionProvider`.

**Returns:**

```tsx
type FeedbackSessionContextType = {
  // The active session with its persisted comments, or null
  session: ActiveFeedbackSession | null;

  // The pending operation
  sessionState:
    | "idle"
    | "creating"
    | "confirming"
    | "startingResolution"
    | "completingResolution";

  // Mirrors the canResolveSession prop
  canResolve: boolean;

  createSession: (options: {
    user: User; // required
    type?: SessionType;
    projectId?: string;
  }) => Promise<{ error: KnownError | null }>;
  confirmSession: () => Promise<{ error: KnownError | null }>;
  startResolving: () => Promise<{ error: KnownError | null }>;
  resolveSession: () => Promise<{ error: KnownError | null }>;

  // Subscribe to session transitions
  events: SessionEvents;
};
```

`createSession` requires `user`. It defaults `type` to `"feedback"` and `projectId` to the provider `projectId`. Without a `user` it is refused with a `SessionCreateError` ("user is required"), returned as `{ error }` and passed to `onError`, and `onCreateSession` is not called. A failed or refused action returns `{ error }` and also calls `onError`. A second call of the same transition while it is pending resolves with `{ error: null }` and does nothing.

```tsx
function SessionToolbar() {
  const { session, sessionState, canResolve, confirmSession, startResolving } =
    useFeedbackSession();

  if (!session) return null;

  return (
    <div>
      <span>Status: {session.status}</span>
      {session.status === 'draft' && (
        <button disabled={sessionState !== 'idle'} onClick={confirmSession}>
          Confirm
        </button>
      )}
      {session.status === 'confirmed' && canResolve && (
        <button disabled={sessionState !== 'idle'} onClick={startResolving}>
          Start resolving
        </button>
      )}
    </div>
  );
}
```

#### Session events

`useFeedbackSession().events` mirrors the comment events. Each method accepts a callback and returns an `unsubscribe` function. Every event receives the `ActiveFeedbackSession` after the transition.

| Event | Trigger | Callback Signature |
|-------|---------|-------------------|
| `onSessionCreated` | A draft session was created | `(session: ActiveFeedbackSession) => void` |
| `onSessionConfirmed` | The session moved to `confirmed` | `(session: ActiveFeedbackSession) => void` |
| `onSessionResolving` | The session moved to `resolving` | `(session: ActiveFeedbackSession) => void` |
| `onSessionResolved` | The session moved to `resolved` | `(session: ActiveFeedbackSession) => void` |

```tsx
function SessionTracker() {
  const { events } = useFeedbackSession();

  useEffect(
    () =>
      events.onSessionConfirmed((session) => {
        analytics.track('session_confirmed', {
          id: session.id,
          comments: session.comments.length,
        });
      }),
    [events],
  );

  return null;
}
```

#### `useComments()`

Access the comment context and actions. Throws outside a `CommentContextProvider` (and outside a `FeedbackSessionProvider`).

**Returns:**

```tsx
interface CommentContext {
  // Comments of the active session, after the draftVisibility filter
  draftComments: CommentType[];
  comments: CommentType[]; // Published comments
  resolvedComments: CommentType[];
  allComments: CommentType[];

  // State
  overlayState: CommentOverlayState;
  currentUser: User | null;
  config: Config | undefined;
  // Mirrors the canResolveSession prop of the session provider
  canResolve: boolean;

  // Actions
  registerComment: (position: Position, indicatorPosition?: Indicator) => void;
  updateComment: (
    id: string,
    newComment: Pick<CommentType, "content">,
  ) => Promise<{ error: KnownError | null }>;
  deleteComment: (id: string) => Promise<{ error: KnownError | null }>;
  resolveComment: (id: string) => Promise<{ error: KnownError | null }>;
  reopenComment: (id: string) => Promise<{ error: KnownError | null }>;
  focusOnComment: (id: string | null) => void;
  getActiveComment: () => CommentType | undefined;
  toggleOverlay: () => void;
  changeOverlayState: (state: CommentOverlayState) => void;
  updateCommentVisibility: (visibility: Partial<CommentVisibility>) => void;
  triggerError: (error: KnownError) => void;

  // Events - subscribe to comment lifecycle changes
  events: CommentEvents;
}
```

`updateComment` adds a draft comment (`onAdd`) or edits a published one (`onEdit`). It needs a `draft` session and rejects empty content for new comments. `resolveComment` and `reopenComment` need a `resolving` session and `canResolveSession`, and they do nothing (`{ error: null }`) when the comment is already in the target status.

**Example:**

```tsx
import { useComments } from '@kendew-agency/react-feedback-layer';

function CommentToolbar() {
  const { allComments, overlayState, toggleOverlay, config } = useComments();

  return (
    <div>
      <button onClick={toggleOverlay}>
        {overlayState === 'inactive' ? 'Enable' : 'Disable'} Comments
      </button>
      <span>{allComments.length} comments</span>
      {config?.commentVisibility && (
        <span>Resolved hidden: {config.commentVisibility.hideResolved ? 'Yes' : 'No'}</span>
      )}
    </div>
  );
}
```

#### `useCommentScope()`

Access scoped data for a specific comment (must be used within `Comment.Root`).

**Returns:**

```tsx
interface CommentScope {
  comment: CommentType;
  isActive: boolean;
  draft: string;
  setDraft: React.Dispatch<React.SetStateAction<string>>;
}
```

```tsx
function CustomCommentContent() {
  const { comment, isActive, draft } = useCommentScope();

  return (
    <div className={isActive ? 'active' : ''}>
      <p>{draft}</p>
      <small>By {comment.user?.name}</small>
    </div>
  );
}
```

#### Comment events

`useComments().events` provides a subscription-based system for reacting to comment changes. Each method accepts a callback and returns an `unsubscribe` function.

| Event | Trigger | Callback Signature |
|-------|---------|-------------------|
| `onFocusChange` | Focus moves to a different comment | `(commentId: string \| null, comment: CommentType \| undefined) => void` |
| `onCommentRegistered` | A new draft comment is created | `(comment: CommentType) => void` |
| `onCommentAdded` | A comment was persisted through `onAdd` | `(comment: CommentType) => void` |
| `onCommentEdited` | A comment was persisted through `onEdit` | `(comment: CommentType) => void` |
| `onCommentResolved` | A comment was resolved | `(comment: CommentType) => void` |
| `onCommentReopened` | A resolved comment was reopened | `(comment: CommentType) => void` |
| `onCommentDeleted` | A comment is deleted | `(commentId: string) => void` |

```tsx
function CommentTracker() {
  const { events } = useComments();

  useEffect(() => {
    const unsubs = [
      events.onCommentAdded((comment) => {
        analytics.track('comment_added', { id: comment.id });
      }),
      events.onCommentResolved((comment) => {
        toast.success(`Resolved: ${comment.content}`);
      }),
      events.onCommentReopened((comment) => {
        toast(`Reopened: ${comment.content}`);
      }),
      events.onCommentDeleted((id) => {
        analytics.track('comment_deleted', { commentId: id });
      }),
    ];

    return () => unsubs.forEach((unsub) => unsub());
  }, [events]);

  return null;
}
```

Type definitions:

```tsx
import type {
  CommentEvents,
  CommentEventMap,
  SessionEvents,
  SessionEventMap,
  Unsubscribe,
} from '@kendew-agency/react-feedback-layer/types';
```

### Draft visibility

`config.draftVisibility` controls whether comments that other users already persisted are shown while the session is a draft.

| Value | Effect while the session is a `draft` |
|-------|----------------------------------------|
| `"visible"` (default) | All comments of the session are shown |
| `"hidden"` | Only your own comments are shown. Comments of other users are hidden. |

- The default is `"visible"`. Any other value falls back to `"visible"`.
- It only applies while the session status is `draft`. Once the session is `confirmed`, `resolving` or `resolved`, all comments of the session are shown.
- Your own local drafts are always shown. Comments without a `user.id` are also shown.
- Hidden comments are removed from `draftComments`, `comments`, `resolvedComments` and `allComments`.

```tsx
<CommentContextProvider config={{ draftVisibility: 'hidden' }} /* ... */>
```

### Types

Import types from the `/types` subpath:

```tsx
import type {
  CommentType,
  ConfirmedComment,
  User,
  Position,
  Indicator,
  CommentOverlayState,
  CommentVisibility,
  DraftVisibility,
  Config,
  FeedbackSession,
  ActiveFeedbackSession,
  InitialFeedbackSession,
  SessionStatus,
  SessionType,
  SessionOperationState,
  CreateSessionInput,
  KnownError,
} from '@kendew-agency/react-feedback-layer/types';
```

#### `CommentType`

```tsx
type CommentType = {
  id: string;
  position: Position;
  content: string;
  user: User | null;
  createdAt: Date;
  resolvedAt?: Date;
  status: "draft" | "published" | "resolved";
  indicator?: Indicator | null;
  sessionId: string;
  projectId?: string;
};

// A persisted comment, as passed to onAdd, onEdit, onResolve and onReopen
type ConfirmedComment = Omit<CommentType, "status"> & {
  status: "published" | "resolved";
};
```

#### `FeedbackSession`

```tsx
type SessionType = "feedback";
type SessionStatus = "draft" | "confirmed" | "resolving" | "resolved";

type FeedbackSession = {
  id: string;
  type: SessionType;
  status: SessionStatus;
  createdAt: Date;
  createdBy: string; // user id
  participantIds: string[];
  confirmedAt?: Date;
  resolvedAt?: Date;
  projectId?: string;
  sourceSessionId?: string; // reserved, no behavior depends on it
};

// The session held by the provider
type ActiveFeedbackSession = FeedbackSession & {
  comments: ConfirmedComment[];
};

// Accepted by initialSession. comments is optional.
type InitialFeedbackSession = FeedbackSession & {
  comments?: ConfirmedComment[];
};
```

`participantIds` gets the `user.id` of every user that added a comment while the session is a draft.

#### `User`

```tsx
type User = {
  id?: string;
  name: string;
  avatar?: string;
};
```

#### `Position`

```tsx
type Position = {
  x: number;
  y: number;
};
```

#### `Indicator`

```tsx
type Indicator = {
  width: number;
  height: number;
};
```

#### `CommentVisibility`

```tsx
type CommentVisibility = {
  hideResolved?: boolean;
};
```

#### `Config`

```tsx
type Config = {
  // Custom prefix for comment IDs
  idPrefix?: string;
  // Visibility of comment indicators (default: "always")
  indicatorVisibility?: "always" | "active";
  // Comment visibility settings
  commentVisibility?: CommentVisibility;
  // Visibility of other users' comments in a draft session (default: "visible")
  draftVisibility?: "hidden" | "visible";
};
```

## Usage Examples

### Basic Implementation

```tsx
import {
  Comment,
  CommentContextProvider,
  CommentOverlay,
  CommentRenderer,
  ConfirmSession,
  CreateSession,
  FeedbackSessionProvider,
  ToggleOverlayButton,
  useComments,
} from '@kendew-agency/react-feedback-layer';

function DraftComment({ comment }) {
  return (
    <Comment.Root comment={comment} className="draft-comment">
      <Comment.Indicator className="indicator" />
      <div className="comment-body">
        <Comment.Edit placeholder="Add your feedback..." />
        <div className="actions">
          <Comment.Confirm>Save</Comment.Confirm>
          <Comment.Delete>Cancel</Comment.Delete>
        </div>
      </div>
    </Comment.Root>
  );
}

function PublishedComment({ comment }) {
  const { canResolve } = useComments();

  return (
    <Comment.Root comment={comment} className="published-comment">
      <Comment.Indicator className="indicator" />
      <div className="comment-body">
        <Comment.Content />
        <div className="meta">
          <span>{comment.user?.name}</span>
          <span>{comment.createdAt.toLocaleDateString()}</span>
        </div>
        <div className="actions">
          {canResolve && <Comment.Resolve>Resolve</Comment.Resolve>}
          <Comment.Delete>Delete</Comment.Delete>
        </div>
      </div>
    </Comment.Root>
  );
}

function ResolvedComment({ comment }) {
  return (
    <Comment.Root comment={comment} className="resolved-comment">
      <Comment.Content />
      <Comment.Reopen>Reopen</Comment.Reopen>
    </Comment.Root>
  );
}

function App() {
  return (
    <FeedbackSessionProvider
      onCreateSession={async ({ type, user, projectId }) => {
        const response = await fetch('/api/sessions', {
          method: 'POST',
          body: JSON.stringify({ type, user, projectId }),
        });
        if (!response.ok) throw new Error('Failed to create session');
        return response.json();
      }}
      onConfirmSession={async (sessionId) => {
        await fetch(`/api/sessions/${sessionId}/confirm`, { method: 'POST' });
      }}
      onError={(error) => console.error(error.code, error.message)}
    >
      <CommentContextProvider
        currentUser={{ name: 'John Doe', id: '123' }}
        onAdd={async (comment) => {
          const response = await fetch('/api/comments', {
            method: 'POST',
            body: JSON.stringify(comment),
          });
          if (!response.ok) throw new Error('Failed to save comment');
        }}
        onError={(error) => console.error(error.code, error.message)}
      >
        <ToggleOverlayButton>Toggle Feedback Mode</ToggleOverlayButton>
        <CreateSession user={currentUser}>Start session</CreateSession>
        <ConfirmSession>Send feedback</ConfirmSession>

        <CommentOverlay>
          <YourContent />
          <CommentRenderer
            Comment={PublishedComment}
            DraftComment={DraftComment}
            ResolvedComment={ResolvedComment}
          />
        </CommentOverlay>
      </CommentContextProvider>
    </FeedbackSessionProvider>
  );
}
```

### Resuming a session

Pass the saved session as `initialSession`. Each of its comments, and each entry of `initialComments`, needs a `sessionId` equal to the `initialSession` id. Comments with another `sessionId` are not shown.

```tsx
<FeedbackSessionProvider initialSession={savedSession} canResolveSession>
  <CommentContextProvider
    initialComments={savedSession.comments}
    initialOverlayState="idle"
    onError={handleError}
  >
    {/* ... */}
  </CommentContextProvider>
</FeedbackSessionProvider>
```

`initialComments` is optional. Without it, the provider starts with `initialSession.comments`.

### With Real-time Subscription

```tsx
function App() {
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    // Example with a WebSocket or real-time database
    setSubscription({
      subscribe: (callback) => socket.on('comments:update', callback),
      unsubscribe: () => socket.off('comments:update'),
    });
  }, []);

  return (
    <FeedbackSessionProvider onCreateSession={createSession}>
      <CommentContextProvider
        currentUser={currentUser}
        subscription={subscription}
        onAdd={saveComment}
        onError={(error) => console.error(error)}
      >
        {/* ... */}
      </CommentContextProvider>
    </FeedbackSessionProvider>
  );
}
```

### Custom Toolbar with Visibility Controls

```tsx
import { useComments, useFeedbackSession } from '@kendew-agency/react-feedback-layer';

function CommentToolbar() {
  const { draftComments, resolvedComments, config, updateCommentVisibility } =
    useComments();
  const { session, sessionState, confirmSession, startResolving, resolveSession } =
    useFeedbackSession();

  return (
    <div className="toolbar">
      <div className="stats">
        <span>Session: {session?.status ?? 'none'}</span>
        <span>{draftComments.length} drafts</span>
        <span>{resolvedComments.length} resolved</span>
      </div>

      <label>
        <input
          type="checkbox"
          checked={!config?.commentVisibility?.hideResolved}
          onChange={(e) =>
            updateCommentVisibility({ hideResolved: !e.target.checked })
          }
        />
        Show Resolved
      </label>

      <div className="actions">
        <button
          onClick={confirmSession}
          disabled={session?.status !== 'draft' || sessionState !== 'idle'}
        >
          {sessionState === 'confirming' ? 'Confirming...' : 'Confirm session'}
        </button>
        <button onClick={startResolving} disabled={session?.status !== 'confirmed'}>
          Start resolving
        </button>
        <button onClick={resolveSession} disabled={session?.status !== 'resolving'}>
          Resolve session
        </button>
      </div>
    </div>
  );
}
```

### Using the `asChild` Prop

The `asChild` prop (powered by Radix UI Slot) lets you render components as different elements:

```tsx
import { Comment } from '@kendew-agency/react-feedback-layer';

function CustomComment({ comment }) {
  return (
    <Comment.Root comment={comment}>
      {/* Render as a custom button */}
      <Comment.Confirm asChild>
        <MyCustomButton variant="primary">
          Save Comment
        </MyCustomButton>
      </Comment.Confirm>

      {/* Render content as a div */}
      <Comment.Content asChild>
        <div className="rich-text-content" />
      </Comment.Content>
    </Comment.Root>
  );
}
```

## Configuration Options

The `config` prop of `CommentContextProvider` customizes the comment layer.

### ID Prefix

```tsx
<CommentContextProvider config={{ idPrefix: 'proj_a_' }} /* "proj_a_uuid" */>
```

### Indicator Visibility

```tsx
<CommentContextProvider
  config={{
    indicatorVisibility: 'active', // Only show when comment is active
    // or 'always' (default)
  }}
>
```

### Comment Visibility

Hide resolved comments from the UI:

```tsx
<CommentContextProvider
  config={{ commentVisibility: { hideResolved: true } }}
>
```

Update it dynamically:

```tsx
function VisibilityControls() {
  const { config, updateCommentVisibility } = useComments();

  return (
    <label>
      <input
        type="checkbox"
        checked={!config?.commentVisibility?.hideResolved}
        onChange={(e) =>
          updateCommentVisibility({ hideResolved: !e.target.checked })
        }
      />
      Show Resolved Comments
    </label>
  );
}
```

### Draft Visibility

See [Draft visibility](#draft-visibility). Default `"visible"`, applies only while the session is a draft.

## Advanced Patterns

### Project ID

Set `projectId` on `FeedbackSessionProvider` to send it to `onCreateSession`, and on `CommentContextProvider` to attach it to every new comment.

```tsx
<FeedbackSessionProvider
  projectId="proj_123456789"
  onCreateSession={({ projectId, user, type }) =>
    api.createSession({ projectId, user, type })
  }
>
  <CommentContextProvider
    projectId="proj_123456789"
    onAdd={(comment) => api.addComment(comment)} // comment.projectId is set
    onError={handleError}
  >
    {children}
  </CommentContextProvider>
</FeedbackSessionProvider>
```

### Programmatic Comment Creation

```tsx
import { useComments } from '@kendew-agency/react-feedback-layer';

function CustomTool() {
  const { registerComment } = useComments();

  const addCommentAtElement = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    const rect = element.getBoundingClientRect();
    registerComment(
      { x: rect.right, y: rect.bottom },
      { width: rect.width, height: rect.height }
    );
  };

  return (
    <button onClick={() => addCommentAtElement('target-element')}>
      Comment on Element
    </button>
  );
}
```

`registerComment` needs a `draft` session. Otherwise `onError` receives a `SessionStateError`.

### Error Handling

Both providers accept an optional `onError`. Every failure is reported there, including overlay interaction errors such as adding a comment while editing. Every action also returns `{ error }`.

```tsx
function ConfirmButton() {
  const { confirmSession, sessionState } = useFeedbackSession();

  const handleConfirm = async () => {
    const { error } = await confirmSession();
    if (error) {
      alert(`Failed to confirm: ${error.message}`);
    }
  };

  return (
    <button onClick={handleConfirm} disabled={sessionState === 'confirming'}>
      {sessionState === 'confirming' ? 'Confirming...' : 'Confirm session'}
    </button>
  );
}
```

#### Error codes

| Code | Error class | Origin |
|------|-------------|--------|
| `SESSION_CREATE_ERROR` | `SessionCreateError` | `createSession` or `onCreateSession` failed |
| `CONFIRM_ERROR` | `ConfirmError` | `onConfirmSession` failed |
| `START_RESOLVING_ERROR` | `StartResolvingError` | `onStartResolving` failed |
| `SESSION_RESOLVE_ERROR` | `SessionResolveError` | `onResolveSession` failed |
| `SESSION_STATE_ERROR` | `SessionStateError` | The action is not allowed in the current session state |
| `PERMISSION_ERROR` | `PermissionError` | `canResolveSession` is `false` |
| `ADD_ERROR` | `AddError` | `onAdd` failed or the content is empty |
| `EDIT_ERROR` | `EditError` | `onEdit` failed |
| `DELETE_ERROR` | `DeleteError` | `onDelete` failed |
| `RESOLVE_ERROR` | `ResolveError` | `onResolve` failed |
| `REOPEN_ERROR` | `ReopenError` | `onReopen` failed |
| `INSERT_ERROR` | `InsertError` | The overlay refused to add a comment |
| `UNKNOWN_ERROR` | `UnknownError` | Anything else |

```ts
switch (error.code) {
  case "PERMISSION_ERROR":
    alert('You are not allowed to do this')
    break
  case "SESSION_STATE_ERROR":
    alert('This is not possible in the current session state')
    break
  case "CONFIRM_ERROR":
    alert('Failed to confirm your session')
    break
  default:
    alert('An unknown error occured')
}
```

### Filtering and Searching Comments

```tsx
import { useComments } from '@kendew-agency/react-feedback-layer';
import { useState } from 'react';

function CommentList() {
  const { allComments } = useComments();
  const [filter, setFilter] = useState('');
  
  const filteredComments = allComments.filter(comment =>
    comment.content.toLowerCase().includes(filter.toLowerCase()) ||
    comment.user?.name.toLowerCase().includes(filter.toLowerCase())
  );
  
  return (
    <div>
      <input
        type="text"
        placeholder="Search comments..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      <ul>
        {filteredComments.map(comment => (
          <li key={comment.id}>
            <strong>{comment.user?.name}:</strong> {comment.content}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Migrating from 0.3.x

Comments now live in feedback sessions, so the batch confirm and resolve flow is gone. Each removed API maps to a replacement:

| Removed | Replacement |
|---------|-------------|
| `confirmComments()` from `useComments()` | `confirmSession()` from `useFeedbackSession()` |
| `resolveComments()` from `useComments()` | `resolveComment(id)` per comment, then `resolveSession()` from `useFeedbackSession()` |
| `onConfirm(comments, projectId)` on `CommentContextProvider` | `onAdd(comment)` per comment on `CommentContextProvider`, and `onConfirmSession(sessionId, type)` on `FeedbackSessionProvider` |
| `onResolve(comments[])` on `CommentContextProvider` | `onResolve(comment)` for a single comment on `CommentContextProvider`, and `onResolveSession(sessionId)` on `FeedbackSessionProvider` |
| `<ConfirmComments />` | `<ConfirmSession />` |
| `<ResolveComments />` | `<ResolveSession />`, and `<Comment.Resolve />` per comment |
| `events.onCommentsConfirmed` | `events.onCommentAdded` (per comment) and `useFeedbackSession().events.onSessionConfirmed` |
| `events.onCommentsResolved` | `events.onCommentResolved` (per comment) and `useFeedbackSession().events.onSessionResolved` |
| `toggleResolvingComment(id)` | `startResolving()` for the session, then `resolveComment(id)` and `reopenComment(id)` |

Other breaking changes:

- **A session provider is required.** `CommentContextProvider` and `useComments()` throw without a `FeedbackSessionProvider`. Using the comment layer standalone, without a session provider, is no longer possible.
- **The `resolving` comment status is removed.** `CommentType["status"]` is now `"draft" | "published" | "resolved"`. The resolving phase belongs to the session (`SessionStatus` `"resolving"`).
- **`resolvingComments` is removed** from `useComments()`.
- **The `hideResolving` filter is removed** from `CommentVisibility` and `config.commentVisibility`. Only `hideResolved` remains.
- **The `ResolvingComment` prop is removed** from `CommentRenderer`. Pass `Comment`, `DraftComment` and `ResolvedComment`.
- **`initialComments` need a `sessionId`** equal to the `initialSession` id. Comments of another session are not shown, and without an active session no comments are shown.
- **`CommentType` has a required `sessionId`** field.
- **`onError` is optional** on both providers.

Before:

```tsx
<CommentContextProvider
  currentUser={user}
  onConfirm={(comments, projectId) => api.createComments(comments, projectId)}
  onResolve={(comments) => api.resolveComments(comments)}
  onError={handleError}
>
```

After:

```tsx
<FeedbackSessionProvider
  canResolveSession={isReviewer}
  onCreateSession={api.createSession}
  onConfirmSession={(sessionId) => api.confirmSession(sessionId)}
  onResolveSession={(sessionId) => api.resolveSession(sessionId)}
  onError={handleError}
>
  <CommentContextProvider
    currentUser={user}
    onAdd={(comment) => api.addComment(comment)}
    onResolve={(comment) => api.resolveComment(comment)}
    onError={handleError}
  >
```

## Styling

This library is completely unstyled (headless). Here's a basic CSS example to get started:

```css
/* Comment positioning */
[data-comment] {
  position: absolute;
  z-index: 30;
}

[data-comment][data-active="true"] {
  z-index: 40;
}

/* Indicator box */
[data-parent] {
  border: 2px dashed #3b82f6;
  background: rgba(59, 130, 246, 0.1);
  pointer-events: none;
}

/* Comment card */
.comment-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  min-width: 250px;
}

.comment-card[data-active="true"] {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

/* Overlay */
[data-overlay] {
  position: relative;
}

/* Guard layer */
[data-comment-guard] {
  position: fixed;
  inset: 0;
  z-index: 20;
  background: rgba(0, 0, 0, 0.1);
}
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires support for:
  - React 18+
  - CSS `position: absolute`
  - Pointer Events API
  - `crypto.randomUUID()`

## TypeScript

This library is written in TypeScript and includes full type definitions. No additional `@types` packages needed.

```tsx
import type { CommentType, User } from '@kendew-agency/react-feedback-layer/types';

const user: User = {
  id: '123',
  name: 'John Doe',
  avatar: '/avatar.jpg',
};

const comment: CommentType = {
  id: crypto.randomUUID(),
  position: { x: 100, y: 200 },
  content: 'Great work!',
  user,
  createdAt: new Date(),
  status: 'published',
  sessionId: 'session-1',
};
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Development

```bash
# Install dependencies
npm install

# Start development build (watch mode)
npm run dev

# Run playground for testing
npm run playground

# Type checking
npm run typecheck

# Linting and formatting
npm run format-and-lint:fix

# Build for production
npm run build
```

## License

MIT © [Kendew Agency](https://github.com/Kendew-Agency)

## Links

- [GitHub Repository](https://github.com/Kendew-Agency/react-feedback-layer)
- [Issue Tracker](https://github.com/Kendew-Agency/react-feedback-layer/issues)
- [NPM Package](https://www.npmjs.com/package/@kendew-agency/react-feedback-layer)

## Changelog

A list if breaking changes that could impact the way you configured the package

### Unreleased

- Added feedback sessions. See [Feedback Sessions](#feedback-sessions) and the [migration guide](#migrating-from-03x). `FeedbackSessionProvider` is now required around `CommentContextProvider`.
- Added `FeedbackSessionProvider`, `useFeedbackSession()`, `CreateSession` (takes a required `user` prop), `ConfirmSession`, `StartResolving`, `ResolveSession` and `Comment.Reopen`.
- `createSession` takes the user explicitly through `options.user`. There is no user provider: pass `currentUser` to `CommentContextProvider` and `user` to `createSession` or `<CreateSession user>`.
- Added the `onAdd`, `onEdit`, `onDelete` and `onReopen` callbacks, a single-comment `onResolve`, `resolveComment`, `reopenComment`, `canResolve` and the `config.draftVisibility` option.
- Added the session events `onSessionCreated`, `onSessionConfirmed`, `onSessionResolving` and `onSessionResolved`, and the comment events `onCommentAdded`, `onCommentEdited`, `onCommentResolved` and `onCommentReopened`.
- Breaking: removed `confirmComments`, `resolveComments`, `onConfirm`, array `onResolve`, `ConfirmComments`, `ResolveComments`, `onCommentsConfirmed` and `onCommentsResolved`. Removed the `resolving` comment status, `resolvingComments`, the `hideResolving` filter and the `ResolvingComment` renderer prop. Standalone use without a session provider is no longer possible. `initialComments` need a `sessionId` equal to the `initialSession` id.

### 0.3.2
- Added `withPosition` prop to `Comment.Root`. It defaults to `true`, so existing behavior is unchanged. Set it to `false` to skip the absolute positioning styles (`position`, `top`, `left`), for example when rendering comments in a list.

### 0.3.1
- Added `events` to the `useComments()` hook. You can now subscribe to comment lifecycle events such as `onFocusChange`, `onCommentsConfirmed`, `onCommentsResolved`, `onCommentDeleted`, and `onCommentRegistered`. Each event method returns an unsubscribe function for easy cleanup.
- New types exported: `CommentEvents`, `CommentEventMap`, `Unsubscribe`.

### 0.3.0
- Added `projectId` prop to `CommentContextProvider`. When set, the project ID is attached to every new comment and passed as a second argument to the `onConfirm` callback. Update your `onConfirm` signature from `(comments) => ...` to `(comments, projectId?) => ...`.
- `onError` is now a required prop on `CommentContextProvider`. If you previously omitted it, you must provide an error handler.
- Added `InsertError` error class and `INSERT_ERROR` error code. The overlay now triggers `onError` instead of using `alert()` when a user tries to add a comment while editing or dismisses an empty comment.
- Added `triggerError` method to the comment context (available via `useComments()`), allowing programmatic error triggering through the `onError` callback.
- `CommentType` now includes an optional `projectId` field.

### 0.2.0
- Reworked the subscription system. The system remains in beta and may change in the future. Configurations made with version 0.1.2 or older will need adjustment after updating.
- `mode` was defined twice in props. It has been removed as a root prop and is now only part of the config.

