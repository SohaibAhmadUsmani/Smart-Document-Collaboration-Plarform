/**
 * @file TableCellMenu.jsx
 * @description Floating contextual ribbon menu for table row/column operations in TipTap.
 * Provides controls to add/delete rows & columns, merge cells, and delete tables.
 * @module frontend/src/modules/editor/components/TableCellMenu
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Jab user kisi table cell ke andar cursor rakhta hai toh yeh contextual menu pop up hota hai.
 * Row add/delete, Column add/delete, cell merge/split, aur table delete karne ke quick buttons provide karta hai.
 */

import React from 'react';
import {
  Columns,
  Rows,
  Plus,
  Trash2,
  Table as TableIcon,
  Minimize2,
} from 'lucide-react';

/**
 * Contextual Table Cell Menu.
 *
 * [ROMAN URDU]:
 * Table controls menu component.
 *
 * @param {Object} props
 * @param {Object} props.editor - TipTap editor instance
 * @returns {React.JSX.Element|null}
 */
export function TableCellMenu({ editor }) {
  if (!editor || !editor.isActive('table')) return null;

  const btnClass =
    'p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs flex items-center gap-1 transition-colors';

  return (
    <div
      role="toolbar"
      aria-label="Table Actions"
      className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg animate-in fade-in zoom-in-95 duration-100 z-30"
    >
      <button
        type="button"
        onClick={() => editor.chain().focus().addColumnBefore().run()}
        className={btnClass}
        title="Add Column Before"
      >
        <Columns className="w-3.5 h-3.5" />
        <span className="text-[10px]">Col +←</span>
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().addColumnAfter().run()}
        className={btnClass}
        title="Add Column After"
      >
        <Columns className="w-3.5 h-3.5" />
        <span className="text-[10px]">Col +→</span>
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().deleteColumn().run()}
        className="p-1.5 rounded hover:bg-rose-50 text-rose-600 text-xs flex items-center gap-1"
        title="Delete Column"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span className="text-[10px]">Del Col</span>
      </button>

      <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />

      <button
        type="button"
        onClick={() => editor.chain().focus().addRowBefore().run()}
        className={btnClass}
        title="Add Row Above"
      >
        <Rows className="w-3.5 h-3.5" />
        <span className="text-[10px]">Row +↑</span>
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().addRowAfter().run()}
        className={btnClass}
        title="Add Row Below"
      >
        <Rows className="w-3.5 h-3.5" />
        <span className="text-[10px]">Row +↓</span>
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().deleteRow().run()}
        className="p-1.5 rounded hover:bg-rose-50 text-rose-600 text-xs flex items-center gap-1"
        title="Delete Row"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span className="text-[10px]">Del Row</span>
      </button>

      <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />

      <button
        type="button"
        onClick={() => editor.chain().focus().deleteTable().run()}
        className="p-1.5 rounded hover:bg-rose-50 text-rose-600 text-xs flex items-center gap-1 font-semibold"
        title="Delete Whole Table"
      >
        <TableIcon className="w-3.5 h-3.5" />
        <span className="text-[10px]">Delete Table</span>
      </button>
    </div>
  );
}

export default TableCellMenu;
