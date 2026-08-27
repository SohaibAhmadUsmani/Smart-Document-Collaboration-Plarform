/**
 * @file DocumentOutline.jsx
 * @description Table of Contents (TOC) outline tree component generated from document headings (H1-H6).
 * @module frontend/src/modules/editor/components/DocumentOutline
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh component document ke tamam headings (H1 se H6) se dynamic Table of Contents banata hai
 * aur heading par click karne se scroll-to-heading action trigger karta hai.
 */

import React, { useMemo } from 'react';
import { extractHeadingsOutline } from '../utils/astWalker.js';
import { ListTree } from 'lucide-react';

/**
 * Table of Contents outline component.
 *
 * [ROMAN URDU]:
 * Document Table of Contents widget.
 *
 * @param {Object} props
 * @param {Object} props.content - Document ProseMirror AST JSON tree
 * @param {Function} [props.onHeadingClick] - Callback when heading item is clicked
 * @returns {React.JSX.Element}
 */
export function DocumentOutline({ content, onHeadingClick }) {
  const headings = useMemo(() => {
    return extractHeadingsOutline(content);
  }, [content]);

  if (headings.length === 0) {
    return (
      <div className="p-4 text-xs text-slate-400 text-center italic">
        No headings found. Add H1, H2, or H3 headings to populate outline.
      </div>
    );
  }

  return (
    <nav className="p-3 space-y-1 text-xs" aria-label="Document Outline Table of Contents">
      <div className="flex items-center gap-1.5 px-2 py-1 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
        <ListTree className="w-3.5 h-3.5" />
        <span>Outline</span>
      </div>

      <ul className="space-y-0.5 mt-1">
        {headings.map((h, i) => (
          <li key={h.blockId || i}>
            <button
              type="button"
              onClick={() => onHeadingClick?.(h)}
              className={`w-full text-left truncate py-1 px-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                h.level === 1
                  ? 'font-bold text-slate-800 dark:text-slate-200 pl-2'
                  : h.level === 2
                  ? 'font-medium text-slate-600 dark:text-slate-300 pl-4'
                  : 'text-slate-500 dark:text-slate-400 pl-6'
              }`}
              title={h.text}
            >
              {h.text || 'Untitled Heading'}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default DocumentOutline;
