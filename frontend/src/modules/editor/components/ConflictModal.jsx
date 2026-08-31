import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Server, Smartphone, GitMerge, Check, X } from 'lucide-react';
import { extractPlainTextFromAst } from '../utils/astConverters.js';

/**
 * 409 Conflict Resolution Modal Component (DocSync Pro)
 *
 * [Issue #14]: Provides interactive conflict resolution when optimistic concurrency control (OCC)
 * detects that another collaborator pushed newer changes to the document version.
 *
 * [ROMAN URDU]:
 * Version conflict (HTTP 409) aane par yeh modal user ko options deta hai:
 * 1. Server Version rakhna (local changes discard karna)
 * 2. Apni local changes rakhna (server overwrite karna)
 * 3. Dono contents ko merge karna
 * Focus trapping (#29) aur Framer Motion animations shamil hain.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Object} props.conflictData - Conflict payload { serverDocument, localContent, localPlainText, error }
 * @param {Function} props.onResolve - Callback when user picks a resolution: (resolutionPayload: Object) => void
 * @param {Function} [props.onClose] - Callback to close/dismiss
 */
export function ConflictModal({
  isOpen = false,
  conflictData = null,
  onResolve,
  onClose,
}) {
  const [activeDiffTab, setActiveDiffTab] = useState('diff'); // 'diff' | 'server' | 'local'
  const modalRef = useRef(null);
  const previouslyFocusedElementRef = useRef(null);

  // Focus trapping and keyboard dismiss
  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedElementRef.current = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = setTimeout(() => {
      const focusable = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable && focusable.length > 0) {
        focusable[0].focus();
      }
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocusedElementRef.current && previouslyFocusedElementRef.current.focus) {
        previouslyFocusedElementRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen || !conflictData) return null;

  const { serverDocument, localContent, localPlainText } = conflictData;

  const serverText =
    serverDocument?.plainText ||
    (serverDocument?.content ? extractPlainTextFromAst(serverDocument.content) : '') ||
    'No content';

  const localText =
    localPlainText ||
    (localContent ? extractPlainTextFromAst(localContent) : '') ||
    'No content';

  const serverVersion = serverDocument?.version || 'Latest';

  const handleKeepServer = () => {
    onResolve?.({
      resolution: 'keep_server',
      serverDocument,
    });
  };

  const handleKeepLocal = () => {
    onResolve?.({
      resolution: 'keep_local',
      serverDocument,
      serverVersion: serverDocument?.version,
    });
  };

  const handleMerge = () => {
    const serverBlocks = Array.isArray(serverDocument?.content?.content)
      ? serverDocument.content.content
      : [];
    const localBlocks = Array.isArray(localContent?.content) ? localContent.content : [];

    const mergedContent = {
      type: 'doc',
      content: [
        ...localBlocks,
        {
          type: 'paragraph',
          attrs: { blockId: `merge_sep_${Date.now()}` },
          content: [
            {
              type: 'text',
              text: '--- [Server Updates Below] ---',
              marks: [{ type: 'italic' }, { type: 'bold' }],
            },
          ],
        },
        ...serverBlocks,
      ],
    };

    const mergedPlainText = `${localText}\n\n--- [Server Updates Below] ---\n\n${serverText}`;

    onResolve?.({
      resolution: 'merge',
      serverDocument,
      serverVersion: serverDocument?.version,
      mergedContent,
      mergedPlainText,
    });
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 select-none"
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) onClose();
        }}
      >
        <motion.div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="conflict-modal-title"
          aria-describedby="conflict-modal-desc"
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-rose-200 dark:border-rose-900/50 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-rose-50/80 dark:bg-rose-950/40 border-b border-rose-100 dark:border-rose-900/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 id="conflict-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                  Version Conflict Detected (HTTP 409)
                </h2>
                <p id="conflict-modal-desc" className="text-xs text-rose-700 dark:text-rose-400">
                  Another collaborator saved newer edits (Server v{serverVersion}) while you were typing.
                </p>
              </div>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close conflict modal"
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Diff Tabs Navigation */}
          <div className="px-6 pt-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveDiffTab('diff')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all ${
                  activeDiffTab === 'diff'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Side-by-Side Comparison
              </button>
              <button
                type="button"
                onClick={() => setActiveDiffTab('local')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all ${
                  activeDiffTab === 'local'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Your Local Edits Only
              </button>
              <button
                type="button"
                onClick={() => setActiveDiffTab('server')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all ${
                  activeDiffTab === 'server'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Server Version Only
              </button>
            </div>
          </div>

          {/* Diff Content Comparison Area */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-xs">
            {activeDiffTab === 'diff' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Local Column */}
                <div className="flex flex-col border border-amber-200 dark:border-amber-900/60 rounded-xl bg-amber-50/30 dark:bg-amber-950/20 p-3.5 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-amber-200/60 dark:border-amber-800 font-semibold text-amber-900 dark:text-amber-300">
                    <div className="flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4" />
                      <span>Your Unsaved Local Edits</span>
                    </div>
                  </div>
                  <div className="font-mono text-[11px] whitespace-pre-wrap text-slate-800 dark:text-slate-200 max-h-56 overflow-y-auto p-2 bg-white dark:bg-slate-800/90 rounded border border-amber-100 dark:border-amber-900/40">
                    {localText}
                  </div>
                </div>

                {/* Server Column */}
                <div className="flex flex-col border border-blue-200 dark:border-blue-900/60 rounded-xl bg-blue-50/30 dark:bg-blue-950/20 p-3.5 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-blue-200/60 dark:border-blue-800 font-semibold text-blue-900 dark:text-blue-300">
                    <div className="flex items-center gap-1.5">
                      <Server className="w-4 h-4" />
                      <span>Latest Server Version (v{serverVersion})</span>
                    </div>
                  </div>
                  <div className="font-mono text-[11px] whitespace-pre-wrap text-slate-800 dark:text-slate-200 max-h-56 overflow-y-auto p-2 bg-white dark:bg-slate-800/90 rounded border border-blue-100 dark:border-blue-900/40">
                    {serverText}
                  </div>
                </div>
              </div>
            )}

            {activeDiffTab === 'local' && (
              <div className="p-4 bg-amber-50/30 dark:bg-slate-800/50 rounded-xl border border-amber-200 dark:border-amber-900/60 font-mono text-[11px] whitespace-pre-wrap text-slate-800 dark:text-slate-200 max-h-72 overflow-y-auto">
                {localText}
              </div>
            )}

            {activeDiffTab === 'server' && (
              <div className="p-4 bg-blue-50/30 dark:bg-slate-800/50 rounded-xl border border-blue-200 dark:border-blue-900/60 font-mono text-[11px] whitespace-pre-wrap text-slate-800 dark:text-slate-200 max-h-72 overflow-y-auto">
                {serverText}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/70 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
              Select a resolution strategy to continue:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleKeepServer}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs focus-visible:ring-2 focus-visible:ring-blue-500 outline-none"
              >
                Keep Server (Discard Local)
              </button>

              <button
                type="button"
                onClick={handleMerge}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors flex items-center gap-1.5 shadow-2xs focus-visible:ring-2 focus-visible:ring-purple-500 outline-none"
              >
                <GitMerge className="w-3.5 h-3.5" />
                Merge Both
              </button>

              <button
                type="button"
                onClick={handleKeepLocal}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-98 text-white shadow-xs transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-rose-500 outline-none"
              >
                <Check className="w-3.5 h-3.5" />
                Overwrite Server With My Changes
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ConflictModal;

