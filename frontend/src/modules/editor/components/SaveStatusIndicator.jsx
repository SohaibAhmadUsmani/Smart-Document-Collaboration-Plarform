/**
 * @file SaveStatusIndicator.jsx
 * @description Autosave state badge pill component.
 * Renders visual indicators for saving, saved, offline saved, version conflict, and sync error states.
 * @module frontend/src/modules/editor/components/SaveStatusIndicator
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh component document ke autosave status ki live visual pill render karta hai:
 * - Saving: Rotating spinner ke sath
 * - Saved: Green checkmark aur last saved timestamp ke sath
 * - Offline Saved: Yellow indicator
 * - Conflict: Red alert badge
 */

import React from 'react';
import { SAVE_STATUS } from '../types/document.js';
import { Check, Loader2, AlertCircle, CloudOff } from 'lucide-react';

/**
 * Autosave status indicator pill.
 *
 * [ROMAN URDU]:
 * Autosave status indicator component.
 *
 * @param {Object} props
 * @param {string} props.status - Current save status token from SAVE_STATUS enum
 * @param {Date|string|null} [props.lastSavedAt] - Timestamp of last successful save
 * @returns {React.JSX.Element}
 */
export function SaveStatusIndicator({ status, lastSavedAt }) {
  const formatTime = (time) => {
    if (!time) return '';
    const date = new Date(time);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  switch (status) {
    case SAVE_STATUS.SAVING:
      return (
        <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Saving...</span>
        </div>
      );

    case SAVE_STATUS.OFFLINE_SAVED:
      return (
        <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium" title="Buffered locally in browser storage">
          <CloudOff className="w-3.5 h-3.5" />
          <span>Saved Offline</span>
        </div>
      );

    case SAVE_STATUS.CONFLICT:
      return (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-bold" title="Version mismatch with server">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Conflict Detected</span>
        </div>
      );

    case SAVE_STATUS.ERROR:
      return (
        <div className="flex items-center gap-1.5 text-xs text-rose-500 font-medium">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Save Failed</span>
        </div>
      );

    case SAVE_STATUS.SAVED:
    default:
      return (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <Check className="w-3.5 h-3.5" />
          <span>Saved {lastSavedAt ? `at ${formatTime(lastSavedAt)}` : ''}</span>
        </div>
      );
  }
}

export default SaveStatusIndicator;
