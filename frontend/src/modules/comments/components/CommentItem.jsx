import React from 'react';

/**
 * Presentational component for a single comment.
 * Handles display of author, body, timestamp, and resolved status.
 * Action callbacks are received via props to keep this component reusable.
 *
 * @param {Object} props
 * @param {Object} props.comment - Comment data object
 * @param {Function} [props.onReply] - Called when Reply is clicked
 * @param {Function} [props.onResolve] - Called when Resolve is clicked
 * @param {Function} [props.onDelete] - Called when Delete is clicked
 * @param {boolean} [props.isResolving] - Whether resolve is in progress
 * @param {boolean} [props.isDeleting] - Whether delete is in progress
 * @param {boolean} [props.showActions=true] - Whether to show action buttons
 */
export function CommentItem({
  comment,
  onReply,
  onResolve,
  onDelete,
  isResolving = false,
  isDeleting = false,
  showActions = true,
}) {
  if (!comment) return null;

  const author =
    comment.author && typeof comment.author === 'object'
      ? comment.author
      : null;
  const authorName = author?.name || 'Unknown user';
  const createdAt = comment.createdAt
    ? new Date(comment.createdAt).toLocaleString()
    : '';
  const isResolved = Boolean(comment.resolved);
  const anchorQuote = comment.exactQuote || null;

  return (
    <div
      className={`comment-item rounded-md border px-3 py-2.5 ${
        isResolved
          ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20'
          : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
              {authorName}
            </span>
            {isResolved && (
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                Resolved
              </span>
            )}
          </div>
          {createdAt && (
            <time className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 block">
              {createdAt}
            </time>
          )}
        </div>
      </div>

      <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
        {comment.body}
      </p>

      {anchorQuote && (
        <div className="mt-2 rounded-md bg-amber-50/80 border-l-2 border-amber-400 px-2.5 py-1.5 text-xs text-amber-800 dark:bg-amber-950/30 dark:border-amber-600 dark:text-amber-200 italic">
          "{anchorQuote}"
        </div>
      )}

      {showActions && (
        <div className="mt-2 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-2">
          {onReply && (
            <button
              type="button"
              onClick={() => onReply(comment)}
              className="text-xs font-medium text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
            >
              Reply
            </button>
          )}
          {onResolve && (
            <button
              type="button"
              onClick={() => onResolve(comment._id)}
              disabled={isResolving}
              className="text-xs font-medium text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResolving ? 'Resolving...' : isResolved ? 'Unresolve' : 'Resolve'}
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(comment._id)}
              disabled={isDeleting}
              className="text-xs font-medium text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
