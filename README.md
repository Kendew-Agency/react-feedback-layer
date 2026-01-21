# @kendew-agency/react-feedback-layer

A drop-in React feedback layer for collecting contextual user feedback through interactive comments and annotations. Perfect for design review tools, bug reporting systems, and collaborative annotation platforms. 

Have a look at the [changelog](#changelog) when updating the package.

## Features

- 🎯 **Contextual Feedback** - Click or drag to create comments anywhere on your UI
- 💬 **Comment Lifecycle** - Draft → Published → Resolving → Resolved states
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

```tsx
import {
  CommentContextProvider,
  CommentOverlay,
  CommentRenderer,
} from '@kendew-agency/react-feedback-layer';

function App() {
  const handleConfirm = async (comments) => {
    // Save comments to your database
    await saveToDatabase(comments);
  };

  const handleResolve = async (comments) => {
    // Mark comments as resolved in your database
    await resolveInDatabase(comments);
  };

  return (
    <CommentContextProvider
      currentUser={{ name: 'John Doe', id: 'user-123' }}
      onConfirm={handleConfirm}
      onResolve={handleResolve}
      initialComments={[]}
    >
      <CommentOverlay>
        <YourContent />
        <CommentRenderer
          Comment={YourCommentComponent}
          DraftComment={YourDraftComponent}
          ResolvingComment={YourResolvingComponent}
          ResolvedComment={YourResolvedComponent}
        />
      </CommentOverlay>
    </CommentContextProvider>
  );
}
```

## Core Concepts

### Comment Lifecycle

Comments flow through four distinct states:

1. **Draft** - Newly created, not yet saved
2. **Published** - Confirmed and saved to your database
3. **Resolving** - Marked for resolution (in progress)
4. **Resolved** - Completed and archived

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
</Comment.Root>
```

## Complete API Reference

### Components

#### `CommentContextProvider`

The root provider that manages all comment state and actions.

**Props:**

```tsx
interface CommentOverlayProps {
  // Initial comments from your database
  initialComments?: ConfirmedComment[];
  
  // Current logged-in user
  currentUser: User | null;
  
  // Your app content
  children: ReactNode;
  
  // Initial overlay state (default: "inactive")
  initialOverlayState?: "idle" | "editing" | "saving" | "error" | "resolving" | "inactive";
  
  // Optional real-time subscription
  subscription?: {
    subscribe: (update: unknown) => void;
    unsubscribe: () => void;
  };
  
  // Callback when user confirms draft comments
  onConfirm: (comments: ConfirmedComment[]) => Promise<void>;
  
  // Callback when user resolves comments
  onResolve: (comments: ConfirmedComment[]) => Promise<void>;
  
  // Callback to handle errors (optional)
  onError?: (error: KnownError) => void;
  
  // Optional configuration for the comment layer
  config?: {
    // Custom prefix for comment IDs
    idPrefix?: string;
    // Visibility of comment indicators: "always" | "active"
    indicatorVisibility?: "always" | "active";
    // Comment visibility settings
    commentVisibility?: {
      hideResolved?: boolean;
      hideResolving?: boolean;
    };
  };
}
```

**Example:**

```tsx
<CommentContextProvider
  currentUser={{ name: 'Jane Smith', id: '456', avatar: '/avatar.jpg' }}
  initialComments={existingComments}
  onConfirm={async (comments) => {
    await api.createComments(comments);
  }}
  onResolve={async (comments) => {
    await api.resolveComments(comments);
  }}
  onError={(error) => {
    console.error('Comment operation failed:', error);
    toast.error('Failed to save comments');
  }}
  initialOverlayState="idle"
  config={{
    idPrefix: 'proj_',
    indicatorVisibility: 'active',
    commentVisibility: {
      hideResolved: false,
      hideResolving: false,
    },
  }}
>
  {children}
</CommentContextProvider>
```

#### `CommentOverlay`

Creates an interactive overlay for adding comments via click or drag selection.

**Props:**

```tsx
interface CommentOverlayProps {
  children: ReactNode;
}
```

**Behavior:**

- **Click** - Creates a comment at the clicked position
- **Drag** - Creates a comment with a visual indicator box
- **Inactive State** - Renders children without overlay when `overlayState === "inactive"`

**Example:**

```tsx
<CommentOverlay>
  <div>Your annotatable content</div>
  <CommentRenderer {...} />
</CommentOverlay>
```

#### `CommentRenderer`

Renders all comments based on their current state.

**Props:**

```tsx
interface CommentRendererProps {
  // Component for published comments
  Comment: ElementType<{ comment: CommentType }>;
  
  // Component for draft comments
  DraftComment: ElementType<{ comment: CommentType }>;
  
  // Component for resolving comments
  ResolvingComment: ElementType<{ comment: CommentType }>;
  
  // Component for resolved comments
  ResolvedComment: ElementType<{ comment: CommentType }>;
}
```

**Example:**

```tsx
<CommentRenderer
  Comment={PublishedComment}
  DraftComment={DraftComment}
  ResolvingComment={ResolvingComment}
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
  children?: ReactNode;
  defaultDraft?: string; // Initial draft content
}
```

**Example:**

```tsx
<Comment.Root comment={comment} className="comment-card">
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

Button to toggle resolving state (only for published/resolving comments).

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

#### Action Components

##### `ToggleOverlayButton`

Toggles the comment overlay on/off.

**Props:**

```tsx
interface CommentButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}
```

**Example:**

```tsx
import { ToggleOverlayButton } from '@kendew-agency/react-feedback-layer';

<ToggleOverlayButton className="toggle-btn">
  Toggle Comments
</ToggleOverlayButton>
```

##### `ConfirmComments`

Confirms all draft comments and triggers the `onConfirm` callback.

**Example:**

```tsx
import { ConfirmComments } from '@kendew-agency/react-feedback-layer';

<ConfirmComments className="btn-save">
  Save All Comments
</ConfirmComments>
```

##### `ResolveComments`

Resolves all resolving comments and triggers the `onResolve` callback.

**Example:**

```tsx
import { ResolveComments } from '@kendew-agency/react-feedback-layer';

<ResolveComments className="btn-resolve-all">
  Resolve All
</ResolveComments>
```

### Hooks

#### `useComments()`

Access the global comment context and actions.

**Returns:**

```tsx
interface CommentContext {
  // Filtered comment arrays
  draftComments: CommentType[];
  comments: CommentType[]; // Published comments
  resolvingComments: CommentType[];
  resolvedComments: CommentType[];
  allComments: CommentType[];
  
  // State
  overlayState: CommentOverlayState;
  currentUser: User | null;
  config: Config | undefined;
  
  // Actions
  registerComment: (position: Position, indicatorPosition?: Indicator) => void;
  updateComment: (id: string, newComment: Pick<CommentType, "content">) => void;
  deleteComment: (id: string) => void;
  focusOnComment: (id: string | null) => void;
  getActiveComment: () => CommentType | undefined;
  toggleOverlay: () => void;
  toggleResolvingComment: (id: string) => void;
  changeOverlayState: (state: CommentOverlayState) => void;
  confirmComments: () => Promise<{ error: Error | DOMException | null }>;
  resolveComments: () => Promise<{ error: Error | DOMException | null }>;
  updateCommentVisibility: (visibility: Partial<CommentVisibility>) => void;
}
```

**Example:**

```tsx
import { useComments } from '@kendew-agency/react-feedback-layer';

function CommentToolbar() {
  const { 
    draftComments, 
    confirmComments, 
    overlayState,
    toggleOverlay,
    config 
  } = useComments();
  
  return (
    <div>
      <button onClick={toggleOverlay}>
        {overlayState === 'inactive' ? 'Enable' : 'Disable'} Comments
      </button>
      <button 
        onClick={confirmComments}
        disabled={draftComments.length === 0}
      >
        Save {draftComments.length} Comments
      </button>
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

**Example:**

```tsx
import { useCommentScope } from '@kendew-agency/react-feedback-layer';

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
  CommentAction,
  Config
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
  status: "draft" | "published" | "resolving" | "resolved";
  indicator?: Indicator | null;
};
```

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
  hideResolving?: boolean;
};
```

#### `Config`

```tsx
type Config = {
  // Custom prefix for comment IDs
  idPrefix?: string;
  // Visibility of comment indicators
  indicatorVisibility?: "always" | "active";
  // Comment visibility settings
  commentVisibility?: CommentVisibility;
};
```

## Usage Examples

### Basic Implementation

```tsx
import {
  CommentContextProvider,
  CommentOverlay,
  CommentRenderer,
  Comment,
  ToggleOverlayButton,
  ConfirmComments,
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
          <Comment.Resolve>Resolve</Comment.Resolve>
          <Comment.Delete>Delete</Comment.Delete>
        </div>
      </div>
    </Comment.Root>
  );
}

function App() {
  return (
    <CommentContextProvider
      currentUser={{ name: 'John Doe', id: '123' }}
      onConfirm={async (comments) => {
        const response = await fetch('/api/comments', {
          method: 'POST',
          body: JSON.stringify(comments),
        });
        if (!response.ok) {
          throw new Error('Failed to save comments');
        }
      }}
      onResolve={async (comments) => {
        const response = await fetch('/api/comments/resolve', {
          method: 'POST',
          body: JSON.stringify(comments),
        });
        if (!response.ok) {
          throw new Error('Failed to resolve comments');
        }
      }}
      onError={(error) => {
        console.error('Comment operation failed:', error);
        // Show user-friendly error message
      }}
      config={{
        commentVisibility: {
          hideResolved: false,
          hideResolving: false,
        },
      }}
    >
      <ToggleOverlayButton>Toggle Feedback Mode</ToggleOverlayButton>
      <ConfirmComments>Save All Comments</ConfirmComments>
      
      <CommentOverlay>
        <YourContent />
        <CommentRenderer
          Comment={PublishedComment}
          DraftComment={DraftComment}
          ResolvingComment={PublishedComment}
          ResolvedComment={PublishedComment}
        />
      </CommentOverlay>
    </CommentContextProvider>
  );
}
```

### With Real-time Subscription

```tsx
import { useEffect, useState } from 'react';

function App() {
  const [subscription, setSubscription] = useState(null);
  
  useEffect(() => {
    // Example with a WebSocket or real-time database
    const sub = {
      subscribe: (callback) => {
        socket.on('comments:update', callback);
      },
      unsubscribe: () => {
        socket.off('comments:update');
      },
    };
    
    setSubscription(sub);
  }, []);
  
  return (
    <CommentContextProvider
      currentUser={currentUser}
      subscription={subscription}
      onConfirm={saveComments}
      onResolve={resolveComments}
    >
      {/* ... */}
    </CommentContextProvider>
  );
}
```

### Custom Toolbar with Visibility Controls

```tsx
import { useComments } from '@kendew-agency/react-feedback-layer';

function CommentToolbar() {
  const {
    draftComments,
    resolvingComments,
    config,
    updateCommentVisibility,
    confirmComments,
    resolveComments,
    overlayState,
  } = useComments();
  
  return (
    <div className="toolbar">
      <div className="stats">
        <span>{draftComments.length} drafts</span>
        <span>{resolvingComments.length} resolving</span>
      </div>
      
      <div className="visibility">
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
        <label>
          <input
            type="checkbox"
            checked={!config?.commentVisibility?.hideResolving}
            onChange={(e) => 
              updateCommentVisibility({ hideResolving: !e.target.checked })
            }
          />
          Show Resolving
        </label>
      </div>
      
      <div className="actions">
        <button 
          onClick={confirmComments}
          disabled={draftComments.length === 0 || overlayState === 'saving'}
        >
          {overlayState === 'saving' ? 'Saving...' : 'Save Comments'}
        </button>
        <button 
          onClick={resolveComments}
          disabled={resolvingComments.length === 0}
        >
          Resolve All
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

The `config` prop allows you to customize various aspects of the comment system:

### ID Prefix

Add a custom prefix to all comment IDs:

```tsx
<CommentContextProvider
  config={{
    idPrefix: 'proj_a_', // Results in IDs like "proj_a_uuid"
  }}
  // ... other props
>
```

### Indicator Visibility

Control when comment indicators (selection boxes) are shown:

```tsx
<CommentContextProvider
  config={{
    indicatorVisibility: 'active', // Only show when comment is active
    // or 'always' to always show indicators
  }}
  // ... other props
>
```

### Comment Visibility

Hide specific types of comments from the UI:

```tsx
<CommentContextProvider
  config={{
    commentVisibility: {
      hideResolved: true,   // Hide resolved comments
      hideResolving: false, // Show resolving comments
    },
  }}
  // ... other props
>
```

You can also update visibility dynamically:

```tsx
function VisibilityControls() {
  const { config, updateCommentVisibility } = useComments();
  
  return (
    <div>
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
    </div>
  );
}
```

## Advanced Patterns

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

### Error Handling

You can handle errors in two ways:

**1. Using the `onError` callback (recommended):**

```tsx
<CommentContextProvider
  currentUser={currentUser}
  onConfirm={saveComments}
  onResolve={resolveComments}
  onError={(error) => {
    console.error('Comment operation failed:', error);
    // Show user-friendly error message
    toast.error('Failed to save comments. Please try again.');
  }}
>
  {children}
</CommentContextProvider>
```

**2. Handling errors from action results:**

```tsx
import { useComments } from '@kendew-agency/react-feedback-layer';

function SaveButton() {
  const { confirmComments, overlayState } = useComments();
  
  const handleSave = async () => {
    const { error } = await confirmComments();
    
    if (error) {
      console.error('Failed to save comments:', error);
      alert('Failed to save comments. Please try again.');
    } else {
      alert('Comments saved successfully!');
    }
  };
  
  return (
    <button 
      onClick={handleSave}
      disabled={overlayState === 'saving'}
    >
      {overlayState === 'saving' ? 'Saving...' : 'Save Comments'}
    </button>
  );
}
```

#### Error codes
To keep track of the origin of a comment an error code is provided. You can use this code to display a more accurate error message. For example: 
```ts
switch(e.code){
  case "RESOLVE_ERROR":
    alert('Failed to resolve your comments')
    break
  case "CONFIRM_ERROR":
    alert('Failed to submit your comments')
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

### 0.2.0
- Reworked the subscription system. The system remains in beta and may change in the future. Configurations made with version 0.1.2 or older will need adjustment after updating.
- `mode` was defined twice in props. It has been removed as a root prop and is now only part of the config.

