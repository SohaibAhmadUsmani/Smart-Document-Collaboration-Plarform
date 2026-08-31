/**
 * @file useAutosave.js
 * @description Custom React hook for debounced real-time autosaving with offline localStorage queue and OCC 409 conflict detection.
 * @module frontend/src/modules/editor/hooks/useAutosave
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh custom hook document content ko debounce (1500ms) karke backend par autosave karta hai.
 * Agar internet connection na ho toh changes ko `localStorage` queue mein store karta hai aur
 * reconnect hone par automatically sync karta hai. Agar server par newer version save ho chuka ho
 * toh 409 conflict detect karke conflict callback trigger karta hai.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiAutosaveDocument } from '../services/documentApi.js';
import { SAVE_STATUS, AUTOSAVE_DEFAULT_DEBOUNCE_MS } from '../types/document.js';

/**
 * Hook for managing document autosave lifecycle.
 *
 * [ROMAN URDU]:
 * Autosave hook jo saving status, last saved timestamp, offline queue status,
 * aur manual `saveNow` trigger return karta hai.
 *
 * @param {Object} options
 * @param {string} options.documentId - Target document ObjectId
 * @param {Object} options.content - Current TipTap JSON AST content
 * @param {string} [options.plainText=''] - Current plain text string
 * @param {number} [options.currentVersion=1] - Base document version for OCC
 * @param {boolean} [options.enabled=true] - Flag to enable or disable autosave
 * @param {number} [options.debounceMs=1500] - Debounce delay in milliseconds
 * @param {Function|null} [options.onConflictDetected=null] - Callback when 409 conflict occurs
 * @returns {{ status: string, lastSavedAt: Date|null, error: string|null, isOfflineQueued: boolean, saveNow: Function }}
 */
export function useAutosave({
  documentId,
  content,
  plainText = '',
  currentVersion = 1,
  enabled = true,
  debounceMs = AUTOSAVE_DEFAULT_DEBOUNCE_MS,
  onConflictDetected = null,
}) {
  const [status, setStatus] = useState(SAVE_STATUS.IDLE);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [error, setError] = useState(null);
  const [isOfflineQueued, setIsOfflineQueued] = useState(false);

  const timeoutRef = useRef(null);
  const isFirstRender = useRef(true);
  const lastSavedContentRef = useRef(null);

  const QUEUE_KEY = `docsync_offline_queue_${documentId}`;

  // Helper: Persist uncommitted changes to localStorage
  const saveToLocalQueue = useCallback((data) => {
    try {
      localStorage.setItem(
        QUEUE_KEY,
        JSON.stringify({
          documentId,
          content: data.content,
          plainText: data.plainText,
          version: currentVersion,
          queuedAt: Date.now(),
        })
      );
      setIsOfflineQueued(true);
      setStatus(SAVE_STATUS.OFFLINE_SAVED);
    } catch (e) {
      console.error('[LocalStorage Queue Error]:', e);
    }
  }, [QUEUE_KEY, documentId, currentVersion]);

  // Server Save Execution Engine
  const performSave = useCallback(
    async (contentToSave, textToSave) => {
      if (!documentId || !enabled) return;

      // If browser is offline, buffer locally and return
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        saveToLocalQueue({ content: contentToSave, plainText: textToSave });
        return;
      }

      try {
        setStatus(SAVE_STATUS.SAVING);
        setError(null);

        const result = await apiAutosaveDocument(documentId, {
          content: contentToSave,
          plainText: textToSave,
          baseVersion: currentVersion,
        });

        lastSavedContentRef.current = JSON.stringify(contentToSave);
        setLastSavedAt(new Date(result?.updatedAt || Date.now()));
        setStatus(SAVE_STATUS.SAVED);
        setIsOfflineQueued(false);
        try {
          localStorage.removeItem(QUEUE_KEY);
        } catch (e) {}
      } catch (err) {
        if (err.status === 409 || err.code === 'VERSION_CONFLICT') {
          setStatus(SAVE_STATUS.CONFLICT);
          setError('Version conflict detected: Another collaborator saved newer changes.');
          if (onConflictDetected) {
            onConflictDetected({
              localContent: contentToSave,
              serverDocument: err.serverDocument,
            });
          }
        } else {
          // Network or server error -> save locally as fallback
          saveToLocalQueue({ content: contentToSave, plainText: textToSave });
          setError(err.message || 'Saved locally (offline mode)');
        }
      }
    },
    [documentId, enabled, currentVersion, saveToLocalQueue, onConflictDetected, QUEUE_KEY]
  );

  // Auto-sync listener on window reconnect
  useEffect(() => {
    const handleOnline = () => {
      try {
        const queued = localStorage.getItem(QUEUE_KEY);
        if (queued) {
          const parsed = JSON.parse(queued);
          performSave(parsed.content, parsed.plainText);
        }
      } catch (e) {
        localStorage.removeItem(QUEUE_KEY);
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [performSave, QUEUE_KEY]);

  // Trigger debounced save when content changes
  useEffect(() => {
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
    isOfflineQueued,
    saveNow,
  };
}
