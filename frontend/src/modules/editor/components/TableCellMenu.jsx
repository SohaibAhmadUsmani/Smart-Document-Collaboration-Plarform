import React from 'react';
import {
  Plus,
  Trash2,
  Columns,
  Rows,
  Table as TableIcon,
} from 'lucide-react';

export function TableCellMenu({ editor }) {
  if (!editor || !editor.isActive('table')) return null;

  const handleAddRowAfter = () => editor.chain().focus().addRowAfter().run();
  const handleAddRowBefore = () => editor.chain().focus().addRowBefore().run();
  const handleDeleteRow = () => editor.chain().focus().deleteRow().run();

  const handleAddColAfter = () => editor.chain().focus().addColumnAfter().run();
  const handleAddColBefore = () => editor.chain().focus().addColumnBefore().run();
  const handleDeleteCol = () => editor.chain().focus().deleteColumn().run();

  const handleToggleHeaderRow = () => editor.chain().focus().toggleHeaderRow().run();
  const handleDeleteTable = () => editor.chain().focus().deleteTable().run();

  return (
    <div className="flex items-center gap-1 bg-white/98 backdrop-blur-md px-2 py-1.5 rounded-xl shadow-lg border border-slate-200 text-xs text-slate-700">
      <div className="flex items-center gap-1 pr-1 border-r border-slate-200 font-medium text-[11px] text-slate-500">
        <TableIcon className="w-3.5 h-3.5 text-blue-600" />
        <span>Table</span>
      </div>

      {/* Rows */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={handleAddRowAfter}
          title="Add Row Below"
          className="flex items-center gap-0.5 px-1.5 py-1 rounded hover:bg-slate-100 transition-colors"
        >
          <Plus className="w-3 h-3 text-emerald-600" />
          <Rows className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={handleDeleteRow}
          title="Delete Current Row"
          className="p-1 rounded hover:bg-red-50 text-red-600 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />

      {/* Columns */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={handleAddColAfter}
          title="Add Column Right"
          className="flex items-center gap-0.5 px-1.5 py-1 rounded hover:bg-slate-100 transition-colors"
        >
          <Plus className="w-3 h-3 text-emerald-600" />
          <Columns className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={handleDeleteCol}
          title="Delete Current Column"
          className="p-1 rounded hover:bg-red-50 text-red-600 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />

      {/* Header & Delete */}
      <button
        type="button"
        onClick={handleToggleHeaderRow}
        className="px-1.5 py-1 rounded hover:bg-slate-100 text-[11px] font-medium transition-colors"
      >
        Header Row
      </button>

      <button
        type="button"
        onClick={handleDeleteTable}
        title="Delete Entire Table"
        className="px-1.5 py-1 rounded hover:bg-red-50 text-red-600 text-[11px] font-medium transition-colors"
      >
        Delete Table
      </button>
    </div>

  );
}
