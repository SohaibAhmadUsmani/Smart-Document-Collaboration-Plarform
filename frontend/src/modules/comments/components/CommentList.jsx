import React from 'react';
import { CommentThread } from './CommentThread.jsx';

/**
 * Renders a list of top-level comments, each as a CommentThread.
 * Displays an empty state when no comments exist.
 *
 * @param {Object} props
 * @param {Object[]} props.topLevelComments - Array of top-level comments
 * @param {Function} props.getReplies - (commentId) => Comment[] for fetching thread replies
 * @param {Function} props.onReply - Called with (commentId, { body })
 * @param {Function} props.onResolve - Called with commentId
 * @param {Function} props.onDelete - Called with commentId
 * @param {number|null} props.resolvingCommentId - ID of comment being resolved
 * @param {number|null} props.deletingCommentId - ID of comment being deleted
 */
export function CommentList({
  topLevelComments = [],
  getReplies,
  onReply,
  onResolve,
  onDelete,
  resolvingCommentId,
  deletingCommentId,
}) {
  if (topLevelComments.length === 0) {
    return (
      <div className="comment-list-empty flex flex-col items-center justify-center py-8 px-4 text-center">
        <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-3 mb-3">
          <svg
            className="w-6 h-6 text-slate-400 dark:text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          No comments yet
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Start a discussion by adding a comment.
        </p>
      </div>
    );
  }

  return (
    <div className="comment-list space-y-3">
      {topLevelComments.map((comment) => (
        <CommentThread
          key={comment._id}
          comment={comment}
          replies={getReplies(comment._id)}
          onReply={onReply}
          onResolve={onResolve}
          onDelete={onDelete}
          isResolving={resolvingCommentId === comment._id}
          isDeleting={deletingCommentId === comment._id}
        />
      ))}
    </div>
  );
}
