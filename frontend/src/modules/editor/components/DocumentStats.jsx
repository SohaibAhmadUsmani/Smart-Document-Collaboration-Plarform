/**
 * @file DocumentStats.jsx
 * @description Compact document metrics badge widget.
 * Computes and displays live word count, character count, and reading time.
 * @module frontend/src/modules/editor/components/DocumentStats
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh widget document ke plain text se live word count, characters count,
 * aur estimated reading time calculate karke badges ki shakal mein render karta hai.
 */

import React, { useMemo } from 'react';

/**
 * Calculates document word count, character count, and estimated reading time (~200 wpm).
 * [ROMAN URDU]: Text ke alfaz, huroof aur parhne ka waqt shumar karta hai.
 *
 * @param {string} [text=''] - Document plain text content
 * @returns {{ words: number, characters: number, readingTimeMinutes: number }}
 */
export function calculateDocumentStats(text = '') {
  const clean = String(text || '').trim();
  const words = clean ? clean.split(/\s+/).filter(Boolean).length : 0;
  const characters = String(text || '').length;
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));
  return { words, characters, readingTimeMinutes };
}

/**
 * Compact document statistics widget.
 *
 * [ROMAN URDU]:
 * Document statistics badges component.
 *
 * @param {Object} props
 * @param {string} [props.text=''] - Document plain text content
 * @param {string} [props.className=''] - Additional CSS classes
 * @returns {React.JSX.Element}
 */
export function DocumentStats({ text = '', className = '' }) {
  const stats = useMemo(() => {
    return calculateDocumentStats(text);
  }, [text]);

  return (
    <div
      className={`flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 ${className}`}
      aria-label="Document Statistics"
    >
      <span title="Word Count">
        <strong className="font-semibold text-slate-700 dark:text-slate-200">{stats.words}</strong> words
      </span>
      <span className="text-slate-300 dark:text-slate-700">•</span>
      <span title="Character Count">
        <strong className="font-semibold text-slate-700 dark:text-slate-200">{stats.characters}</strong> chars
      </span>
      <span className="text-slate-300 dark:text-slate-700">•</span>
      <span title="Estimated Reading Time">
        <strong className="font-semibold text-slate-700 dark:text-slate-200">{stats.readingTimeMinutes}</strong> min read
      </span>
    </div>
  );
}

export default DocumentStats;
