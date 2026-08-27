import React, { useState, useCallback } from 'react';
import { CommentItem } from './CommentItem.jsx';
import { CommentComposer } from './CommentComposer.jsx';

/**
 * Displays a single comment thread: parent comment + its replies.
 * Provides inline reply capability for the thread.
 *
 * @param {Object} props
 * @param {Object} props.comment - The parent/top-level comment
 * @param {Object[]} props.replies - Array of reply comments
 * @param {Function} props.onReply - Called with (commentId, { body }) for new replies
 * @param {Function} [props.onResolve] - Called with commentId to toggle resolved
 * @param {Function} [props.onDelete] - Called with commentId to delete
 * @param {boolean} [props.isResolving] - Whether resolve is in progress
 * @param {boolean} [props.isDeleting] - Whether delete is in progress
 */
export function CommentThread({
  comment,
  replies = [],
  onReply,
  onResolve,
  onDelete,
  isResolving = false,
  isDeleting = false,
}) {
  const [isReplying, setIsReplying] = useState(false);

  const handleReplySubmit = useCallback(
    async ({ body }) => {
      await onReply(comment._id, { body });
      setIsReplying(false);
    },
    [comment._id, onReply]
  );

  const handleCancelReply = useCallback(() => {
    setIsReplying(false);
  }, []);

  return (
    <div className="comment-thread space-y-1">
      <CommentItem
        comment={comment}
        onReply={() => setIsReplying(true)}
        onResolve={onResolve}
        onDelete={onDelete}
        isResolving={isResolving}
        isDeleting={isDeleting}
      />

      {replies.length > 0 && (
        <div className="ml-4 pl-3 border-l-2 border-slate-100 dark:border-slate-800 space-y-1">
          {replies.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply}
              onReply={null}
              onResolve={onResolve}
              onDelete={onDelete}
              isResolving={isResolving}
              isDeleting={isDeleting}
              showActions={false}
            />
          ))}
        </div>
      )}

      {isReplying && (
        <div className="ml-4 pl-3 border-l-2 border-slate-100 dark:border-slate-800">
          <CommentComposer
            onSubmit={handleReplySubmit}
            isSubmitting={isResolving}
            placeholder="Write a reply..."
            submitLabel="Reply"
            onCancel={handleCancelReply}
          />
        </div>
      )}
    </div>
  );
}
