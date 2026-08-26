# Comments Module

Owner: Ayyan

Frontend module for document comments, mentions, replies, and resolution.

## Structure

```
comments/
├── components/     # React UI components (comment panel, thread, form)
├── hooks/          # Custom hooks (useComments, useCommentThread)
├── services/       # API service functions (commentApi.js)
├── types/          # Type definitions and constants (comment.js)
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

## Integration with Editor

The editor module provides `useCommentAnchors(editorInstance)` which handles:
- `captureSelectionAnchor()` — captures the current selection as anchor data
- `attachCommentMark(threadId)` — applies a CommentMark to the editor
- `resolveAnchor(anchor)` — fuzzy position resolution

The Comments hook does NOT manage anchor state. The UI layer composes both:
1. Use `useCommentAnchors` to capture anchor data from the editor
2. Pass that anchor data into `createComment` payload
3. After creation, use the returned comment `_id` with `attachCommentMark`

## Backend

See: `backend/src/modules/comments/`
