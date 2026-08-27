import React, { useCallback, useEffect } from 'react';
import { useComments } from '../hooks/useComments.js';
import { CommentList } from './CommentList.jsx';
import { CommentComposer } from './CommentComposer.jsx';

/**
 * Main container component for the comments module.
 * Connects useComments hook state to the component tree.
 *
 * Designed to be placed alongside or within the document editor layout.
 * Accepts an optional createAnchorPayload for editor integration —
 * when provided, it is merged into the createComment payload so that
 * anchor data from useCommentAnchors can flow through.
 *
 * @param {Object} props
 * @param {string} props.documentId - The document to load comments for
 * @param {Function|Object|null} [props.createAnchorPayload] - Anchor data from editor selection. Can be a function (called at submission time) or a plain object.
 * @param {Function} [props.onCommentCreated] - Called with the new comment after creation
 * @param {Function} [props.onCommentClick] - Called when a comment is clicked (for navigation)
 * @param {string|null} [props.activeCommentThreadId] - ID of the currently active comment thread in the editor
 * @param {Function} [props.onCommentsLoaded] - Called with the full comments array after fetch completes
 */
export function CommentsPanel({
  documentId,
  createAnchorPayload = null,
  onCommentCreated,
  onCommentClick,
  activeCommentThreadId,
  onCommentsLoaded,
}) {
  const {
    topLevelComments,
    getReplies,
    isLoading,
    isCreating,
    resolvingCommentId,
    deletingCommentId,
    error,
    comments,
    createComment,
    replyToComment,
    resolveComment,
    deleteComment,
    refreshComments,
  } = useComments(documentId);

  // Notify parent when comments are loaded or updated (for mark hydration).
  useEffect(() => {
    if (onCommentsLoaded && !isLoading && comments.length > 0) {
      onCommentsLoaded(comments);
    }
  }, [comments, isLoading, onCommentsLoaded]);

  const handleCreateComment = useCallback(
    async ({ body }) => {
      // Resolve anchor payload: accept either a function (captures at submission time)
      // or a plain object (for testing / static anchor data).
      const anchor =
        typeof createAnchorPayload === 'function'
          ? createAnchorPayload()
          : createAnchorPayload;

      const payload = {
        documentId,
        body,
        ...(anchor || {}),
      };
      const created = await createComment(payload);
      if (created && onCommentCreated) {
        onCommentCreated(created);
      }
      return created;
    },
    [documentId, createAnchorPayload, createComment, onCommentCreated]
  );

  const handleReply = useCallback(
    async (commentId, { body }) => {
      return replyToComment(commentId, { body, documentId });
    },
    [replyToComment, documentId]
  );

  return (
    <div className="comments-panel flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Comments
        </h2>
        <button
          type="button"
          onClick={refreshComments}
          disabled={isLoading}
          className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors disabled:opacity-50"
          title="Refresh comments"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-4 mt-3 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 dark:bg-red-950/40 dark:border-red-900/40 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Comment composer */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <CommentComposer
          onSubmit={handleCreateComment}
          isSubmitting={isCreating}
          placeholder="Write a comment..."
          submitLabel="Comment"
        />
      </div>

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {isLoading && topLevelComments.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <span className="text-sm text-slate-400 dark:text-slate-500">
              Loading comments...
            </span>
          </div>
        ) : (
          <CommentList
            topLevelComments={topLevelComments}
            getReplies={getReplies}
            onReply={handleReply}
            onResolve={resolveComment}
            onDelete={deleteComment}
            resolvingCommentId={resolvingCommentId}
            deletingCommentId={deletingCommentId}
            onCommentClick={onCommentClick}
            activeCommentThreadId={activeCommentThreadId}
          />
        )}
      </div>
    </div>
  );
}
