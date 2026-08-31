/**
 * @file useDocumentSearch.js
 * @description Hook for client-side search and token matching across active document plain text.
 * Calculates occurrence indices and cycles through search results.
 * @module frontend/src/modules/editor/hooks/useDocumentSearch
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh hook document ke plain text ke andar search query match karta hai aur Next/Previous match
 * navigation faraham karta hai.
 */

import { useState, useMemo } from 'react';
import { useDocumentEditor } from './useDocumentEditor.js';

/**
 * Hook for managing in-document text search.
 *
 * [ROMAN URDU]:
 * Search state, match indices, aur navigation handlers return karta hai.
 *
 * @returns {{ searchQuery: string, setSearchQuery: Function, matches: Array<{ index: number, length: number }>, totalMatches: number, currentMatchIndex: number, nextMatch: Function, prevMatch: Function }}
 */
export function useDocumentSearch() {
  const { state, setSearchQuery } = useDocumentEditor();
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  const matches = useMemo(() => {
    if (!state.searchQuery || !state.plainText) return [];

    const query = state.searchQuery.trim().toLowerCase();
    if (!query) return [];

    const indices = [];
    let startIndex = 0;
    const lowerText = state.plainText.toLowerCase();

    while ((startIndex = lowerText.indexOf(query, startIndex)) !== -1) {
      indices.push({
        index: startIndex,
        length: query.length,
      });
      startIndex += query.length;
    }

    return indices;
  }, [state.searchQuery, state.plainText]);

  const nextMatch = () => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % matches.length);
  };

  const prevMatch = () => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev - 1 + matches.length) % matches.length);
  };

  return {
    searchQuery: state.searchQuery,
    setSearchQuery,
    matches,
    totalMatches: matches.length,
    currentMatchIndex: matches.length > 0 ? currentMatchIndex + 1 : 0,
    nextMatch,
    prevMatch,
  };
}
