import React, { useState } from 'react';
import { useDocumentTagsFavorites } from '../hooks/useDocumentTagsFavorites.js';

/**
 * Headless Tag and Star/Favorite control bar.
 */
export function TagFavoriteBar({ isReadOnly = false }) {
  const { tags, isFavorite, favoriteCount, toggleFavorite, addTag, removeTag } = useDocumentTagsFavorites();
  const [tagInput, setTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput.trim());
      setTagInput('');
      setIsAddingTag(false);
    } else if (e.key === 'Escape') {
      setIsAddingTag(false);
      setTagInput('');
    }
  };

  return (
    <div
      data-editor-tag-fav-bar="true"
      className="flex flex-wrap items-center gap-2 px-6 py-2 border-b border-slate-100 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50"
    >
      {/* Star / Favorite Toggle Button */}
      <button
        type="button"
        data-editor-fav-btn="true"
        data-favorited={isFavorite ? 'true' : 'false'}
        onClick={toggleFavorite}
        className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded transition-colors ${
          isFavorite
            ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 font-medium'
            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        title={isFavorite ? 'Remove from favorites' : 'Star this document'}
      >
        <span>{isFavorite ? '★' : '☆'}</span>
        {favoriteCount > 0 && <span>{favoriteCount}</span>}
      </button>

      <div className="h-3 w-px bg-slate-200 dark:bg-slate-700" />

      {/* Tags Chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            data-editor-tag="true"
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded"
          >
            <span>#{tag}</span>
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                title={`Remove tag #${tag}`}
              >
                ×
              </button>
            )}
          </span>
        ))}

        {!isReadOnly && (
          isAddingTag ? (
            <input
              type="text"
              autoFocus
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (tagInput.trim()) addTag(tagInput.trim());
                setIsAddingTag(false);
                setTagInput('');
              }}
              placeholder="tag name..."
              className="text-xs px-2 py-0.5 bg-transparent border border-slate-300 dark:border-slate-700 rounded outline-none w-24 text-slate-800 dark:text-slate-200"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingTag(true)}
              className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              + Tag
            </button>
          )
        )}
      </div>
    </div>
  );
}
