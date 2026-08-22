import React from 'react';
import { SaveStatusIndicator } from './SaveStatusIndicator.jsx';

/**
 * Top header of the document editor with title editing and save status.
 *
 * @param {Object} props
 * @param {string} props.title - Current title of the document
 * @param {Function} props.onTitleChange - Callback when title changes
 * @param {string} props.saveStatus - Current autosave status
 * @param {Date|null} props.lastSavedAt - Last saved timestamp
 * @param {boolean} [props.isReadOnly=false] - If document is in read-only mode
 */
export function EditorHeader({
  title,
  onTitleChange,
  saveStatus,
  lastSavedAt,
  isReadOnly = false,
}) {
  return (
    <header className="flex items-center justify-between px-8 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="flex-1 max-w-2xl mr-4">
        <input
          type="text"
          value={title}
          disabled={isReadOnly}
          onChange={(e) => onTitleChange?.(e.target.value)}
          placeholder="Untitled Document"
          className="w-full text-xl font-semibold bg-transparent border-none outline-none focus:ring-0 placeholder:text-slate-400 text-slate-900 dark:text-slate-100 disabled:opacity-75"
        />
      </div>

      <div className="flex items-center gap-4">
        <SaveStatusIndicator status={saveStatus} lastSavedAt={lastSavedAt} />
      </div>
    </header>
  );
}
