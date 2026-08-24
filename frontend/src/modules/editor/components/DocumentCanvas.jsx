import React from 'react';
import { useTipTapEditor } from '../hooks/useTipTapEditor.js';
import { useDocumentEditor } from '../hooks/useDocumentEditor.js';

/**
 * Headless, unstyled semantic document canvas.
 * Exposes data-editor-* styling hooks so any visual design can be plugged in.
 */
export function DocumentCanvas({ options = {} }) {
  const { state } = useDocumentEditor();
  const { editorRef, isReady, executeCommand } = useTipTapEditor(options);

  return (
    <article
      data-editor-canvas="true"
      data-readonly={state.isReadOnly ? 'true' : 'false'}
      data-save-status={state.saveStatus}
      aria-label="Document Content Canvas"
      role="region"
      className="w-full h-full"
    >
      {!isReady && (
        <div data-editor-skeleton="true" className="animate-pulse p-4 text-slate-400 text-sm">
          Loading editor surface...
        </div>
      )}
      <div
        ref={editorRef}
        data-editor-surface="true"
        tabIndex={0}
        aria-multiline="true"
        className="outline-none min-h-[400px]"
      />
    </article>
  );
}
