# Comments Module

Owner: Ayyan

Frontend module for document comments, mentions, replies, and resolution.

## Structure

```
comments/
├── components/
│   ├── CommentsPanel.jsx      # Main container, connects hook to UI
│   ├── CommentList.jsx        # Renders top-level comments
│   ├── CommentThread.jsx      # Parent comment + replies + reply composer
│   ├── CommentItem.jsx        # Single comment display (presentational)
│   └── CommentComposer.jsx    # Reusable text input for comments/replies
├── hooks/
│   └── useComments.js         # Comment state and CRUD operations
├── services/
│   └── commentApi.js          # API functions for backend endpoints
├── types/
│   └── comment.js             # Type definitions and anchor types
└── README.md
```

## API Service

`services/commentApi.js` provides functions to interact with backend endpoints:

- `apiCreateComment(payload)` — POST /api/comments
- `apiGetDocumentComments(documentId)` — GET /api/comments/document/:documentId
- `apiGetComment(commentId)` — GET /api/comments/:commentId
- `apiReplyToComment(commentId, payload)` — POST /api/comments/:commentId/replies
- `apiResolveComment(commentId)` — PATCH /api/comments/:commentId/resolve
- `apiDeleteComment(commentId)` — DELETE /api/comments/:commentId

## Hook: useComments

`hooks/useComments.js` manages comment state for a document.

```js
const {
  comments,           // All comments for the document
  topLevelComments,   // Comments where parentComment is null
  getReplies,         // (commentId) => Comment[] — get replies for a thread

  isLoading,          // Fetching comments
  isCreating,         // Creating a comment or reply
  resolvingCommentId, // ID of comment currently being resolved (or null)
  deletingCommentId,  // ID of comment currently being deleted (or null)
  error,              // Last error message (or null)

  fetchComments,      // () => Promise<void>
  refreshComments,    // () => Promise<void>
  createComment,      // (payload) => Promise<Comment|null>
  replyToComment,     // (commentId, payload) => Promise<Comment|null>
  resolveComment,     // (commentId) => Promise<Comment|null>
  deleteComment,      // (commentId) => Promise<boolean>
} = useComments(documentId);
```

### createComment payload shape

```js
{
  documentId,        // required
  body,              // required
  anchorType,        // required: 'text_selection' | 'block_node'
  from,              // required
  to,                // required
  exactQuote,        // optional
  prefixContext,     // optional
  suffixContext,     // optional
  blockId,           // optional
  mentions,          // optional: string[]
  parentComment,     // optional: parent comment ID
}
```

## UI Components

### CommentsPanel

Main container that wires `useComments` to the component tree.

```jsx
<CommentsPanel
  documentId={docId}
  createAnchorPayload={anchorData}  // optional: from useCommentAnchors
  onCommentCreated={(comment) => attachCommentMark(comment._id)}
/>
```

| Prop | Type | Description |
|------|------|-------------|
| `documentId` | `string` | Document to load comments for |
| `createAnchorPayload` | `Object\|null` | Optional anchor data merged into create payload |
| `onCommentCreated` | `Function` | Called with the new comment after creation |

### CommentList

Renders top-level comments as threads. Shows empty state when no comments exist.

### CommentThread

Displays a parent comment with its replies and an inline reply composer.

### CommentItem

Presentational component for a single comment. Shows author name, body, timestamp, and resolved status. Actions (reply, resolve, delete) are received as callbacks.

### CommentComposer

Reusable textarea input for creating comments and replies. Supports Ctrl+Enter to submit, cancel, and disabled/loading states.

```jsx
<CommentComposer
  onSubmit={handleSubmit}
  isSubmitting={isCreating}
  placeholder="Write a comment..."
  submitLabel="Comment"
/>
```

## Component Hierarchy

```
CommentsPanel
├── CommentComposer (new top-level comment)
└── CommentList
    └── CommentThread (per top-level comment)
        ├── CommentItem (parent)
        ├── CommentItem (each reply)
        └── CommentComposer (inline reply)
```

## Integration with Editor

The editor module provides `useCommentAnchors(editorInstance)` which handles:
- `captureSelectionAnchor()` — captures the current selection as anchor data
- `attachCommentMark(threadId)` — applies a CommentMark to the editor
- `resolveAnchor(anchor)` — fuzzy position resolution

The Comments hook does NOT manage anchor state. The UI layer composes both:
1. Use `useCommentAnchors` to capture anchor data from the editor
2. Pass that anchor data as `createAnchorPayload` to `CommentsPanel`
3. After creation, use the returned comment `_id` with `attachCommentMark`

### Planned integration flow

```
User selects text in editor
  → useCommentAnchors captures selection via captureSelectionAnchor()
  → CommentsPanel receives anchor data via createAnchorPayload prop
  → User writes comment body in CommentComposer
  → useComments.createComment({ ...anchorData, body })
  → Backend returns comment._id
  → onCommentCreated calls attachCommentMark(comment._id)
```

This flow is supported by the current component structure but not yet wired end-to-end. It will be completed in a future milestone.

## Backend

See: `backend/src/modules/comments/`
