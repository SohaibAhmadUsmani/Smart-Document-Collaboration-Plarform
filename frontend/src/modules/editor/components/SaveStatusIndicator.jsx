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
      <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium">
        <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        <span>Saving changes...</span>
      </div>
    );
  }

  if (status === SAVE_STATUS.OFFLINE_SAVED) {
    return (
      <div
        className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"
        title="Network disconnected. Edits are securely buffered locally and will sync when online."
      >
        <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-ping" />
        <span>Offline (Saved locally)</span>
      </div>
    );
  }

  if (status === SAVE_STATUS.CONFLICT) {
    return (
      <div
        className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"
        title={error || 'Version conflict detected'}
      >
        <span className="inline-block w-2 h-2 rounded-full bg-rose-600" />
        <span>Version Conflict</span>
      </div>
    );
  }

  if (status === SAVE_STATUS.ERROR) {
    return (
      <div
        className="flex items-center gap-1.5 text-xs text-red-600"
        title={error || 'Failed to save changes'}
      >
        <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
        <span>Failed to save</span>
      </div>
    );
  }

  if (status === SAVE_STATUS.SAVED && lastSavedAt) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
        <span>
          Saved at {new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
      <span className="inline-block w-2 h-2 rounded-full bg-slate-300" />
      <span>All changes saved</span>
    </div>
  );
}


