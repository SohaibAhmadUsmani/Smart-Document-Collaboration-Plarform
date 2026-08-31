/**
 * @file useCommentAnchors.js
 * @description Hook to manage comment anchor capture, mark injection, and fuzzy position resolution.
 * Bridges TipTap ProseMirror selection state with Ayyan's Comments Module.
 * @module frontend/src/modules/editor/hooks/useCommentAnchors
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh hook text selection se comment anchor create karne aur ProseMirror mein comment highlight
 * mark lagane ka kaam karta hai. Text shift hone par fuzzyAnchorMatcher ke zariye anchor position
 * resolve karta hai.
 */

import { useCallback } from 'react';
import { useDocumentEditor } from './useDocumentEditor.js';
import { createCommentAnchor, ANCHOR_TYPES } from '../types/commentAnchor.js';
import { resolveCommentAnchorPosition } from '../utils/fuzzyAnchorMatcher.js';

/**
 * Hook for managing document comment anchors and inline highlight marks.
 *
 * [ROMAN URDU]:
 * Selection anchor capture karne, comment mark lagane, aur shifted text par anchor resolve karne ke functions return karta hai.
 *
 * @param {Object} editorInstance - TipTap editor instance
 * @returns {{ captureSelectionAnchor: Function, attachCommentMark: Function, resolveAnchor: Function, activeCommentThreadId: string|null, setActiveCommentThread: Function }}
 */
export function useCommentAnchors(editorInstance) {
  const { state, setActiveCommentThread } = useDocumentEditor();

  /**
   * Captures the current text selection as a structured comment anchor payload.
   * Uses plain text offsets (matching editor.getText()) for consistent position
   * resolution across page refreshes.
   *
   * [ROMAN URDU]:
   * Active text selection ke from/to offsets, exact text quote, aur prefix/suffix context extract karta hai.
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
   *
   * [ROMAN URDU]:
   * Selected text par `commentMark` apply karta hai taake text highlight ho jaye.
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
   *
   * [ROMAN URDU]:
   * Shifted text ke andar fuzzy matcher chala kar anchor ki updated position dhoondta hai.
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
