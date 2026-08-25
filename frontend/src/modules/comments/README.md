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

## Integration with Editor

The editor module already provides:
- `CommentMark` — ProseMirror mark for comment highlights
- `useCommentAnchors` — Hook for anchor creation and mark injection
- `commentAnchor.js` — Types and helper for anchor payloads
- `fuzzyAnchorMatcher.js` — Utility for resolving shifted anchor positions

This module will consume those editor primitives and connect them to the backend API.

## Backend

See: `backend/src/modules/comments/`
