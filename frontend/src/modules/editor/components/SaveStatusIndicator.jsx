import React from 'react';
import { SAVE_STATUS } from '../types/document.js';

/**
 * Visual indicator component for document autosave state.
 *
 * @param {Object} props
 * @param {string} props.status - One of SAVE_STATUS ('idle', 'saving', 'saved', 'error')
 * @param {Date|null} [props.lastSavedAt] - Timestamp of the last successful save
 * @param {string|null} [props.error] - Optional error message
 */
export function SaveStatusIndicator({ status, lastSavedAt, error }) {
  if (status === SAVE_STATUS.SAVING) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
        <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span>Saving changes...</span>
      </div>
    );
  }

  if (status === SAVE_STATUS.ERROR) {
    return (
      <div
        className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400"
        title={error || 'Failed to save changes'}
      >
        <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
        <span>Failed to save</span>
      </div>
    );
  }

  if (status === SAVE_STATUS.SAVED && lastSavedAt) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
        <span>
          Saved at {new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-400">
      <span className="inline-block w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
      <span>All changes saved</span>
    </div>
  );
}
