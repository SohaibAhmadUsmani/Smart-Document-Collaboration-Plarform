/**
 * @file useDocumentTagsFavorites.js
 * @description Hook to manage document tagging and starring/favorites with optimistic UI updates.
 * @module frontend/src/modules/editor/hooks/useDocumentTagsFavorites
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh hook document ke tags add/remove karne aur star/favorite toggle karne ke operations
 * ko optimistic UI update ke sath perform karta hai. Network fail hone par state revert karta hai.
 */

import { useState, useCallback } from 'react';
import { useDocumentEditor } from './useDocumentEditor.js';
import { apiToggleFavorite, apiUpdateTags } from '../services/documentApi.js';

/**
 * Hook to manage document tagging and starring/favorites.
 *
 * [ROMAN URDU]:
 * Tags array, favorite status, aur mutating functions (toggleFavorite, addTag, removeTag) return karta hai.
 *
 * @returns {{ tags: string[], isFavorite: boolean, favoriteCount: number, isUpdating: boolean, toggleFavorite: Function, addTag: Function, removeTag: Function }}
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
