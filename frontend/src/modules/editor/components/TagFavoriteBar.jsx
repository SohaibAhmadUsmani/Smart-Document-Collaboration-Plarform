/**
 * @file TagFavoriteBar.jsx
 * @description Document metadata bar for starring/favorites and interactive tag chip management.
 * Connects with `useDocumentTagsFavorites` for optimistic updates.
 * @module frontend/src/modules/editor/components/TagFavoriteBar
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh bar document ke tags display karti hai, naye tags add/delete karne ka input deti hai,
 * aur document ko star/favorite karne ka interactive button provide karti hai.
 */

import React, { useState } from 'react';
import { useDocumentTagsFavorites } from '../hooks/useDocumentTagsFavorites.js';
import { Star, Tag, Plus, X } from 'lucide-react';

/**
 * Interactive Tag and Favorite Bar.
 *
 * [ROMAN URDU]:
 * Tags aur star favorites component.
 *
 * @returns {React.JSX.Element}
 */
export function TagFavoriteBar() {
  const { tags, isFavorite, favoriteCount, toggleFavorite, addTag, removeTag } =
    useDocumentTagsFavorites();
  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (newTagInput.trim()) {
      addTag(newTagInput.trim());
      setNewTagInput('');
      setIsAddingTag(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-2.5 px-6 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs">
      {/* Left: Star / Favorite Button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleFavorite}
          aria-label={isFavorite ? 'Unstar document' : 'Star document'}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
            isFavorite
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 font-semibold'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400' : ''}`} />
          <span>{isFavorite ? 'Starred' : 'Star'}</span>
          {favoriteCount > 0 && <span className="font-mono text-[10px] opacity-75">({favoriteCount})</span>}
        </button>
      </div>

      {/* Right: Tag Pills & Add Input */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Tag className="w-3.5 h-3.5 text-slate-400 mr-1" />
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-medium text-[11px]"
          >
            #{tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              aria-label={`Remove tag ${tag}`}
              className="text-blue-400 hover:text-blue-700 dark:hover:text-blue-100 ml-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {isAddingTag ? (
          <form onSubmit={handleAddSubmit} className="flex items-center">
            <input
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              placeholder="tag name..."
              autoFocus
              onBlur={() => {
                if (!newTagInput.trim()) setIsAddingTag(false);
              }}
              className="h-6 px-2 text-[11px] rounded-full border border-blue-400 outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 w-24"
            />
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsAddingTag(true)}
            className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-[11px] hover:border-slate-400"
          >
            <Plus className="w-3 h-3" /> Tag
          </button>
        )}
      </div>
    </div>
  );
}

export default TagFavoriteBar;
