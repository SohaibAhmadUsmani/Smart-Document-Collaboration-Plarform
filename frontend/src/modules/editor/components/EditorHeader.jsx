/**
 * @file EditorHeader.jsx
 * @description Top header bar for the document editor with title editing, autosave indicator, and action buttons.
 * @module frontend/src/modules/editor/components/EditorHeader
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh document editor ka top header bar hai jisme document title edit karne ka input,
 * autosave status indicator pill, aur document actions (duplicate, export, archive) shamil hain.
 */

import React from 'react';
import { SaveStatusIndicator } from './SaveStatusIndicator.jsx';
import { EditorActions } from './EditorActions.jsx';

/**
 * Top header of the document editor.
 *
 * [ROMAN URDU]:
 * Header component jo title input, save status indicator, aur action dropdowns render karta hai.
 *
 * @param {Object} props
 * @param {string} props.documentId - Current document ID
 * @param {string} props.title - Current title of the document
 * @param {Function} [props.onTitleChange] - Callback when title changes
 * @param {string} props.saveStatus - Current autosave status
 * @param {Date|null} [props.lastSavedAt] - Last saved timestamp
 * @param {boolean} [props.isReadOnly=false] - If document is in read-only mode
 * @param {Function} [props.onReadOnlyToggle] - Callback to toggle read-only mode
 * @param {Function} [props.onDocumentDuplicated] - Callback when cloned
 * @param {Function} [props.onDocumentArchived] - Callback when archived
 * @returns {React.JSX.Element}
 */
export function EditorHeader({
  documentId,
  title,
  onTitleChange,
  saveStatus,
  lastSavedAt,
  isReadOnly = false,
  onReadOnlyToggle,
  onDocumentDuplicated,
  onDocumentArchived,
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="flex-1 min-w-[240px] max-w-xl">
        <input
          type="text"
          value={title}
          disabled={isReadOnly}
          onChange={(e) => onTitleChange?.(e.target.value)}
          placeholder="Untitled Document"
          className="w-full text-lg font-semibold bg-transparent border-none outline-none focus:ring-0 placeholder:text-slate-400 text-slate-900 dark:text-slate-100 disabled:opacity-75"
        />
      </div>

      <div className="flex items-center gap-4">
        <SaveStatusIndicator status={saveStatus} lastSavedAt={lastSavedAt} />

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

        <EditorActions
          documentId={documentId}
          isReadOnly={isReadOnly}
          onReadOnlyToggle={onReadOnlyToggle}
          onDocumentDuplicated={onDocumentDuplicated}
          onDocumentArchived={onDocumentArchived}
        />
      </div>
    </header>
  );
}

export default EditorHeader;
