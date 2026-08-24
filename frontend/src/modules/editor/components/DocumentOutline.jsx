import React from 'react';
import { useDocumentEditor } from '../hooks/useDocumentEditor.js';
import { extractHeadingsOutline } from '../utils/astWalker.js';

/**
 * Headless Table of Contents (TOC) extracted live from the AST.
 */
export function DocumentOutline({ onSelectHeading }) {
  const { state } = useDocumentEditor();
  const headings = extractHeadingsOutline(state.content);

  if (headings.length === 0) {
    return (
      <nav data-editor-outline="empty" aria-label="Table of Contents" className="text-xs text-slate-400 p-2">
        <span>No headings in document</span>
      </nav>
    );
  }

  return (
    <nav data-editor-outline="tree" aria-label="Table of Contents" className="p-2 space-y-1">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Outline</div>
      <ul data-editor-outline-list="true" className="space-y-1">
        {headings.map((item, idx) => (
          <li
            key={idx}
            data-editor-heading-level={item.level}
            data-block-id={item.blockId}
            style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
          >
            <button
              type="button"
              data-editor-outline-item="true"
              onClick={() => onSelectHeading && onSelectHeading(item)}
              className="text-xs text-left text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white truncate max-w-full"
            >
              {item.text || 'Untitled Section'}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
