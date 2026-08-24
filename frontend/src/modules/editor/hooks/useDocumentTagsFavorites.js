import { useState, useCallback } from 'react';
import { useDocumentEditor } from './useDocumentEditor.js';
import { apiToggleFavorite, apiUpdateTags } from '../services/documentApi.js';

/**
 * Hook to manage document tagging and starring/favorites.
 */
export function useDocumentTagsFavorites() {
  const { state, toggleFavorite: dispatchToggleFav, setTags: dispatchSetTags } = useDocumentEditor();
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleFavorite = useCallback(async () => {
    if (!state.documentId) return;

    try {
      dispatchToggleFav(); // Optimistic update
      await apiToggleFavorite(state.documentId);
    } catch (err) {
      dispatchToggleFav(); // Revert on failure
      console.error('[Toggle Favorite Error]:', err);
    }
  }, [state.documentId, dispatchToggleFav]);

  const addTag = useCallback(
    async (newTag) => {
      if (!state.documentId || !newTag || typeof newTag !== 'string') return;
      const cleanTag = newTag.trim().toLowerCase();
      if (!cleanTag || state.tags.includes(cleanTag)) return;

      const updatedTags = [...state.tags, cleanTag];
      dispatchSetTags(updatedTags);

      try {
        setIsUpdating(true);
        await apiUpdateTags(state.documentId, updatedTags);
      } catch (err) {
        console.error('[Add Tag Error]:', err);
      } finally {
        setIsUpdating(false);
      }
    },
    [state.documentId, state.tags, dispatchSetTags]
  );

  const removeTag = useCallback(
    async (tagToRemove) => {
      if (!state.documentId || !tagToRemove) return;
      const updatedTags = state.tags.filter((t) => t !== tagToRemove);
      dispatchSetTags(updatedTags);

      try {
        setIsUpdating(true);
        await apiUpdateTags(state.documentId, updatedTags);
      } catch (err) {
        console.error('[Remove Tag Error]:', err);
      } finally {
        setIsUpdating(false);
      }
    },
    [state.documentId, state.tags, dispatchSetTags]
  );

  return {
    tags: state.tags,
    isFavorite: state.isFavorite,
    favoriteCount: state.favoriteCount,
    isUpdating,
    toggleFavorite,
    addTag,
    removeTag,
  };
}
