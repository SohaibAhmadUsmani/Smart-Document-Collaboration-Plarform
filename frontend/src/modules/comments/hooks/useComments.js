import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  apiCreateComment,
  apiGetDocumentComments,
  apiReplyToComment,
  apiResolveComment,
  apiDeleteComment,
} from '../services/commentApi.js';

/**
 * Hook for managing comments on a document.
 *
 * Provides state and operations for fetching, creating, replying,
 * resolving, and deleting comments. Designed to work alongside the
 * editor's useCommentAnchors hook — anchor data is passed in at the
 * call site, not managed here.
 *
 * @param {string|null} documentId - The document to load comments for.
 * @returns {Object} Comments state and operations.
 */
export function useComments(documentId) {
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [resolvingCommentId, setResolvingCommentId] = useState(null);
  const [deletingCommentId, setDeletingCommentId] = useState(null);

  // Track in-flight requests to avoid stale setState on unmount or document switch.
  const fetchIdRef = useRef(0);

  /**
   * Fetch all comments for the current document.
   */
  const fetchComments = useCallback(async () => {
    if (!documentId) {
      setComments([]);
      return;
    }

    const currentFetchId = ++fetchIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiGetDocumentComments(documentId);
      if (fetchIdRef.current === currentFetchId) {
        setComments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      if (fetchIdRef.current === currentFetchId) {
        setError(err.message || 'Failed to load comments');
      }
    } finally {
      if (fetchIdRef.current === currentFetchId) {
        setIsLoading(false);
      }
    }
  }, [documentId]);

  // Auto-fetch when documentId changes.
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  /**
   * Create a new comment. Accepts the full backend payload shape.
   * After success, prepends the new comment to local state.
   *
   * @param {Object} payload
   * @param {string} payload.documentId
   * @param {string} payload.body
   * @param {'text_selection' | 'block_node'} payload.anchorType
   * @param {number} payload.from
   * @param {number} payload.to
   * @param {string} [payload.exactQuote]
   * @param {string} [payload.prefixContext]
   * @param {string} [payload.suffixContext]
   * @param {string} [payload.blockId]
   * @param {string[]} [payload.mentions]
   * @param {string} [payload.parentComment]
   * @returns {Promise<Object|null>} The created comment or null on failure.
   */
  const createComment = useCallback(
    async (payload) => {
      setIsCreating(true);
      setError(null);

      try {
        const created = await apiCreateComment(payload);
        setComments((prev) => [created, ...prev]);
        return created;
      } catch (err) {
        setError(err.message || 'Failed to create comment');
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    []
  );

  /**
   * Reply to an existing comment.
   * After success, appends the reply to local state.
   *
   * @param {string} commentId - Parent comment ID.
   * @param {Object} payload
   * @param {string} payload.body
   * @param {'text_selection' | 'block_node'} [payload.anchorType]
   * @param {number} [payload.from]
   * @param {number} [payload.to]
   * @param {string[]} [payload.mentions]
   * @returns {Promise<Object|null>} The created reply or null on failure.
   */
  const replyToComment = useCallback(
    async (commentId, payload) => {
      setIsCreating(true);
      setError(null);

      try {
        const reply = await apiReplyToComment(commentId, payload);
        setComments((prev) => [...prev, reply]);
        return reply;
      } catch (err) {
        setError(err.message || 'Failed to create reply');
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    []
  );

  /**
   * Toggle resolved state on a comment thread.
   * Updates the comment in local state after success.
   *
   * @param {string} commentId
   * @returns {Promise<Object|null>} The updated comment or null on failure.
   */
  const resolveComment = useCallback(async (commentId) => {
    setResolvingCommentId(commentId);
    setError(null);

    try {
      const updated = await apiResolveComment(commentId);
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? { ...c, ...updated } : c))
      );
      return updated;
    } catch (err) {
      setError(err.message || 'Failed to resolve comment');
      return null;
    } finally {
      setResolvingCommentId(null);
    }
  }, []);

  /**
   * Delete a comment. Removes it from local state after success.
   *
   * @param {string} commentId
   * @returns {Promise<boolean>} True on success.
   */
  const deleteComment = useCallback(async (commentId) => {
    setDeletingCommentId(commentId);
    setError(null);

    try {
      await apiDeleteComment(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      return true;
    } catch (err) {
      setError(err.message || 'Failed to delete comment');
      return false;
    } finally {
      setDeletingCommentId(null);
    }
  }, []);

  /**
   * Force refresh comments from the server.
   */
  const refreshComments = useCallback(
    () => fetchComments(),
    [fetchComments]
  );

  // Derived: top-level comments (no parent).
  const topLevelComments = useMemo(
    () => comments.filter((c) => !c.parentComment),
    [comments]
  );

  /**
   * Get replies for a specific parent comment.
   * @param {string} parentCommentId
   * @returns {Object[]}
   */
  const getReplies = useCallback(
    (parentCommentId) => comments.filter((c) => c.parentComment === parentCommentId),
    [comments]
  );

  return {
    // Data
    comments,
    topLevelComments,
    getReplies,

    // Loading states
    isLoading,
    isCreating,
    resolvingCommentId,
    deletingCommentId,

    // Error
    error,

    // Operations
    fetchComments,
    refreshComments,
    createComment,
    replyToComment,
    resolveComment,
    deleteComment,
  };
}
