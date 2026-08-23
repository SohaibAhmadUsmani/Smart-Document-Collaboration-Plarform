import React from 'react';

/**
 * Live document metrics counter widget.
 * Computes words, characters, and reading time in real time.
 *
 * @param {Object} props
 * @param {string} [props.plainText=''] - Plain text extracted from document AST.
 */
export function DocumentStats({ plainText = '' }) {
  const trimmed = (plainText || '').trim();
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
  const characters = (plainText || '').length;
  const readingTime = Math.max(1, Math.ceil(words / 200));

  return (
    <div
      aria-label="Document statistics"
      className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 select-none py-2 px-4 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky bottom-0"
    >
      <div className="flex items-center gap-1">
        <span className="font-semibold text-slate-700 dark:text-slate-300">{words.toLocaleString()}</span>
        <span>words</span>
      </div>

      <div className="flex items-center gap-1">
        <span className="font-semibold text-slate-700 dark:text-slate-300">{characters.toLocaleString()}</span>
        <span>characters</span>
      </div>

      <div className="flex items-center gap-1">
        <span className="font-semibold text-slate-700 dark:text-slate-300">{words > 0 ? `~${readingTime}` : '0'}</span>
        <span>min read</span>
      </div>
    </div>
  );
}
