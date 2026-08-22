import { useState, useEffect, useRef, useCallback } from 'react';
import { apiAutosaveDocument } from '../services/documentApi.js';
import { SAVE_STATUS, AUTOSAVE_DEFAULT_DEBOUNCE_MS } from '../types/document.js';

/**
 * Custom React hook for debounced real-time autosaving of document content.
 *
 * @param {Object} params
 * @param {string} params.documentId - The ID of the document being edited.
 * @param {Object} params.content - Current document AST JSON.
 * @param {string} [params.plainText] - Optional plain text representation for search.
 * @param {boolean} [params.enabled=true] - Whether autosave is active (e.g., false for read-only).
 * @param {number} [params.debounceMs=1500] - Milliseconds of inactivity before triggering save.
 * @returns {{ status: string, lastSavedAt: Date|null, error: string|null, saveNow: Function }}
 */
export function useAutosave({
  documentId,
  content,
  plainText = '',
  enabled = true,
  debounceMs = AUTOSAVE_DEFAULT_DEBOUNCE_MS,
}) {
  const [status, setStatus] = useState(SAVE_STATUS.IDLE);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [error, setError] = useState(null);

  const timeoutRef = useRef(null);
  const isFirstRender = useRef(true);
  const lastSavedContentRef = useRef(null);

  const performSave = useCallback(
    async (contentToSave, textToSave) => {
      if (!documentId || !enabled) return;

      try {
        setStatus(SAVE_STATUS.SAVING);
        setError(null);

        const result = await apiAutosaveDocument(documentId, {
          content: contentToSave,
          plainText: textToSave,
        });

        lastSavedContentRef.current = JSON.stringify(contentToSave);
        setLastSavedAt(new Date(result.updatedAt || Date.now()));
        setStatus(SAVE_STATUS.SAVED);
      } catch (err) {
        console.error('[Autosave Error]:', err);
        setError(err.message || 'Failed to save document');
        setStatus(SAVE_STATUS.ERROR);
      }
    },
    [documentId, enabled]
  );

  // Trigger debounced save when content changes
  useEffect(() => {
    // Skip initial mount to prevent immediate duplicate save
    if (isFirstRender.current) {
      isFirstRender.current = false;
      lastSavedContentRef.current = JSON.stringify(content);
      return;
    }

    if (!enabled || !documentId) return;

    const stringified = JSON.stringify(content);
    if (stringified === lastSavedContentRef.current) {
      return;
    }

    setStatus(SAVE_STATUS.IDLE);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      performSave(content, plainText);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, plainText, enabled, documentId, debounceMs, performSave]);

  // Manual save flush trigger
  const saveNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    return performSave(content, plainText);
  }, [content, plainText, performSave]);

  return {
    status,
    lastSavedAt,
    error,
    saveNow,
  };
}
