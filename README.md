# @kendew/react-feedback-layer

A drop-in React feedback layer for collecting contextual user feedback through interactive comments and annotations.

## Features

- 🎯 Contextual feedback collection with visual indicators
- 💬 Comment system with draft, published, and resolved states
- 👥 User attribution and timestamps
- 🎨 Fully customizable UI components
- 📦 TypeScript support with full type definitions
- ⚡ Zero dependencies (except peer deps)
- 🔧 Flexible component composition

## Installation

```bash
npm install @kendew/react-feedback-layer
```

## Peer Dependencies

This package requires React 18 or higher:

```bash
npm install react react-dom
```

## Quick Start

```tsx
import { CommentOverlay, CommentRenderer } from '@kendew/react-feedback-layer';

function App() {
  return (
    <CommentOverlay>
      <YourContent />
      <CommentRenderer />
    </CommentOverlay>
  );
}
```

## API

### Components

- `CommentOverlay` - Main wrapper component for the feedback layer
- `CommentRenderer` - Renders all comments
- `Comment` - Individual comment component with sub-components
- `CommentActions` - Action buttons for comments

### Hooks

- `useComments()` - Access comment context and actions
- `useCommentScope()` - Access scoped comment data

### Types

Import types from the `/types` subpath:

```tsx
import type { CommentType, User, Position } from '@kendew/react-feedback-layer/types';
```

## License

MIT © Kendew Agency

## Contributing

Issues and pull requests are welcome on [GitHub](https://github.com/Kendew-Agency/react-feedback-layer).
