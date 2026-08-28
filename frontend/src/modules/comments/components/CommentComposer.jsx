import React, { useState, useRef, useCallback } from 'react';

/**
 * Reusable comment input component for creating comments and replies.
 * Manages local input state and delegates submission via callback.
 *
 * @param {Object} props
 * @param {Function} props.onSubmit - Called with { body } on submit
 * @param {boolean} [props.isSubmitting=false] - Disables input during submission
 * @param {string} [props.placeholder='Write a comment...'] - Input placeholder
 * @param {string} [props.cancelLabel='Cancel'] - Cancel button label
 * @param {string} [props.submitLabel='Comment'] - Submit button label
 * @param {boolean} [props.showCancel=true] - Whether to show cancel button
 * @param {Function} [props.onCancel] - Called when cancel is clicked
 */
export function CommentComposer({
  onSubmit,
  isSubmitting = false,
  placeholder = 'Write a comment...',
  cancelLabel = 'Cancel',
  submitLabel = 'Comment',
  showCancel = true,
  onCancel,
}) {
  const [body, setBody] = useState('');
  const textareaRef = useRef(null);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const trimmed = body.trim();
      if (!trimmed || isSubmitting) return;

      try {
        await onSubmit({ body: trimmed });
        setBody('');
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      } catch {
        // Error handling is managed by the parent via isSubmitting state
      }
    },
    [body, isSubmitting, onSubmit]
  );

  const handleCancel = useCallback(() => {
    setBody('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    if (onCancel) onCancel();
  }, [onCancel]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit]
  );

  const handleInput = useCallback((e) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, []);

  const hasBody = body.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="comment-composer">
      <textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        placeholder={placeholder}
        rows={2}
        disabled={isSubmitting}
        className="w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          {hasBody ? 'Ctrl+Enter to submit' : ''}
        </span>
        <div className="flex items-center gap-2">
          {showCancel && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !hasBody}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {isSubmitting ? 'Submitting...' : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
