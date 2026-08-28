import { useCallback } from 'react';
import { useDocumentEditor } from './useDocumentEditor.js';
import { createCommentAnchor, ANCHOR_TYPES } from '../types/commentAnchor.js';
import { resolveCommentAnchorPosition } from '../utils/fuzzyAnchorMatcher.js';

/**
 * Hook to manage comment anchor creation and highlight mark injection.
 */
export function useCommentAnchors(editorInstance) {
  const { state, setActiveCommentThread } = useDocumentEditor();

  /**
   * Captures the current text selection as a structured comment anchor payload.
   * Uses plain text offsets (matching editor.getText()) for consistent position
   * resolution across page refreshes.
   */
  const captureSelectionAnchor = useCallback(() => {
    if (!editorInstance) return null;

    const { from, to } = editorInstance.state.selection;
    if (from === to) return null; // No text selected

    // Use getText() for plain text offsets (consistent with resolver)
    const fullText = editorInstance.getText();
    const exactQuote = fullText.slice(from, to);
    const prefixContext = fullText.slice(Math.max(0, from - 30), from);
    const suffixContext = fullText.slice(to, Math.min(fullText.length, to + 30));

    return createCommentAnchor({
      documentId: state.documentId,
      anchorType: ANCHOR_TYPES.TEXT_SELECTION,
      from,
      to,
      exactQuote,
      prefixContext,
      suffixContext,
    });
  }, [editorInstance, state.documentId]);

  /**
   * Applies a comment mark over the active selection with a thread ID.
   */
  const attachCommentMark = useCallback(
    (commentThreadId) => {
      if (!editorInstance || !commentThreadId) return;

      editorInstance
        .chain()
        .focus()
        .setMark('commentMark', { commentThreadId, isActive: false })
        .run();
    },
    [editorInstance]
  );

  /**
   * Resolves fuzzy anchor position if document text shifted.
   */
  const resolveAnchor = useCallback(
    (anchor) => {
      if (!editorInstance || !anchor) return null;
      const fullText = editorInstance.getText();
      return resolveCommentAnchorPosition(fullText, anchor);
    },
    [editorInstance]
  );

  return {
    captureSelectionAnchor,
    attachCommentMark,
    resolveAnchor,
    activeCommentThreadId: state.activeCommentThreadId,
    setActiveCommentThread,
  };
}
