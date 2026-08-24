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
   */
  const captureSelectionAnchor = useCallback(() => {
    if (!editorInstance) return null;

    const { from, to } = editorInstance.state.selection;
    if (from === to) return null; // No text selected

    const docText = editorInstance.state.doc.textBetween(0, editorInstance.state.doc.content.size, '\n');
    const exactQuote = editorInstance.state.doc.textBetween(from, to, ' ');

    const prefixStart = Math.max(0, from - 30);
    const prefixContext = editorInstance.state.doc.textBetween(prefixStart, from, ' ');

    const suffixEnd = Math.min(editorInstance.state.doc.content.size, to + 30);
    const suffixContext = editorInstance.state.doc.textBetween(to, suffixEnd, ' ');

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
