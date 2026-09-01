/**
 * @file DocumentCanvas.jsx
 * @description Headless semantic document canvas surface component.
 * Exposes data-editor-* styling hooks for custom rendering environments.
 * @module frontend/src/modules/editor/components/DocumentCanvas
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh headless semantic canvas surface hai jo `data-editor-surface` attributes expose karta hai
 * taake kisi bhi visual theme ya layout mein embed kiya ja sake.
 */

import React from 'react';
import { useTipTapEditor } from '../hooks/useTipTapEditor.js';
import { useDocumentEditor } from '../hooks/useDocumentEditor.js';

/**
 * Headless semantic document canvas.
 *
 * [ROMAN URDU]:
 * Semantic article element jo editor surface ko render karta hai aur read-only state track karta hai.
 *
 * @param {Object} props
 * @param {Object} [props.options={}] - Editor configuration options
 * @returns {React.JSX.Element}
 */
export function DocumentCanvas({ options = {} }) {
  const { state } = useDocumentEditor();
  const { editorRef, isReady } = useTipTapEditor(options);

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

export default DocumentCanvas;
