import { useState, useMemo } from 'react';
import { useDocumentEditor } from './useDocumentEditor.js';

/**
 * Hook for client-side search & token matching across active document plain text.
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
