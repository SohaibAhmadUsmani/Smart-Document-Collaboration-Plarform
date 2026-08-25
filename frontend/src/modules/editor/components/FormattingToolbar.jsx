import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link2,
  Image as ImageIcon,
  MessageSquare,
  Undo2,
  Redo2,
  Table as TableIcon,
} from 'lucide-react';

export function FormattingToolbar({
  onCommand,
  activeMarks = {},
  isReadOnly = false,
}) {
  const [styleDropdownOpen, setStyleDropdownOpen] = useState(false);

  // Dynamically derive current style label based on active cursor selection
  const currentStyle = useMemo(() => {
    if (activeMarks.h1) return 'Heading 1';
    if (activeMarks.h2) return 'Heading 2';
    if (activeMarks.h3) return 'Heading 3';
    if (activeMarks.codeBlock) return 'Code Block';
    return 'Normal Text';
  }, [activeMarks]);

  const handleStyleSelect = (cmd, args) => {
    setStyleDropdownOpen(false);
    if (onCommand) {
      onCommand(cmd, args);
    }
  };

  return (
    <div className="sticky top-[108px] z-30 mx-auto my-3.5 w-fit flex items-center gap-1 p-1 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl shadow-md shadow-slate-200/50 select-none">
      {/* 1. Style Dropdown */}
      <div className="relative">
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => setStyleDropdownOpen((prev) => !prev)}
          className="h-[34px] px-3 flex items-center gap-2 rounded-lg hover:bg-slate-100/80 text-xs font-semibold text-slate-800 transition-colors"
        >
          <span>{currentStyle}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {styleDropdownOpen && (
          <div className="absolute top-10 left-0 z-50 w-44 bg-white rounded-lg shadow-xl border border-slate-200 py-1 text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-100">
            <button
              type="button"
              onClick={() => handleStyleSelect('setParagraph')}
              className="w-full text-left px-3.5 py-2 hover:bg-slate-100 transition-colors font-medium"
            >
              Normal Text
            </button>
            <button
              type="button"
              onClick={() => handleStyleSelect('toggleHeading', { level: 1 })}
              className="w-full text-left px-3.5 py-2 font-extrabold text-sm hover:bg-slate-100 transition-colors text-slate-900"
            >
              Heading 1
            </button>
            <button
              type="button"
              onClick={() => handleStyleSelect('toggleHeading', { level: 2 })}
              className="w-full text-left px-3.5 py-2 font-bold hover:bg-slate-100 transition-colors text-slate-900"
            >
              Heading 2
            </button>
            <button
              type="button"
              onClick={() => handleStyleSelect('toggleHeading', { level: 3 })}
              className="w-full text-left px-3.5 py-2 font-semibold hover:bg-slate-100 transition-colors text-slate-800"
            >
              Heading 3
            </button>
            <button
              type="button"
              onClick={() => handleStyleSelect('toggleCodeBlock')}
              className="w-full text-left px-3.5 py-2 font-mono text-[11px] hover:bg-slate-100 transition-colors"
            >
              Code Block
            </button>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="w-[1px] h-5 bg-slate-200 mx-0.5" />

      {/* 2. Inline Styles Group (B, I, U, T) */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => onCommand && onCommand('toggleBold')}
          className={`w-[34px] h-[34px] flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
            activeMarks.bold
              ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200 font-extrabold'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => onCommand && onCommand('toggleItalic')}
          className={`w-[34px] h-[34px] flex items-center justify-center rounded-lg text-xs font-serif italic transition-all ${
            activeMarks.italic
              ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>

        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => onCommand && onCommand('toggleUnderline')}
          className={`w-[34px] h-[34px] flex items-center justify-center rounded-lg text-xs transition-all ${
            activeMarks.underline
              ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Underline (Ctrl+U)"
        >
          <Underline className="w-4 h-4" />
        </button>

        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => onCommand && onCommand('toggleStrike')}
          className={`w-[34px] h-[34px] flex items-center justify-center rounded-lg text-xs transition-all ${
            activeMarks.strike
              ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
      </div>

      {/* Divider */}
      <div className="w-[1px] h-5 bg-slate-200 mx-0.5" />

      {/* 3. Lists & Quote Group */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => onCommand && onCommand('toggleBulletList')}
          className={`w-[34px] h-[34px] flex items-center justify-center rounded-lg text-xs transition-all ${
            activeMarks.bulletList
              ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>

        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => onCommand && onCommand('toggleOrderedList')}
          className={`w-[34px] h-[34px] flex items-center justify-center rounded-lg text-xs transition-all ${
            activeMarks.orderedList
              ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => onCommand && onCommand('toggleTaskList')}
          className={`w-[34px] h-[34px] flex items-center justify-center rounded-lg text-xs transition-all ${
            activeMarks.taskList
              ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Task Checklist"
        >
          <CheckSquare className="w-4 h-4" />
        </button>

        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => onCommand && onCommand('toggleBlockquote')}
          className={`w-[34px] h-[34px] flex items-center justify-center rounded-lg text-xs font-serif transition-all ${
            activeMarks.blockquote
              ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Callout Quote"
        >
          <Quote className="w-4 h-4" />
        </button>
      </div>

      {/* Divider */}
      <div className="w-[1px] h-5 bg-slate-200 mx-0.5" />

      {/* 4. Alignment Controls */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => onCommand && onCommand('setTextAlign', 'left')}
          className={`w-[34px] h-[34px] flex items-center justify-center rounded-lg text-xs transition-all ${
            activeMarks.alignLeft || (!activeMarks.alignCenter && !activeMarks.alignRight && !activeMarks.alignJustify)
              ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => onCommand && onCommand('setTextAlign', 'center')}
          className={`w-[34px] h-[34px] flex items-center justify-center rounded-lg text-xs transition-all ${
            activeMarks.alignCenter
              ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </button>

        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => onCommand && onCommand('setTextAlign', 'right')}
          className={`w-[34px] h-[34px] flex items-center justify-center rounded-lg text-xs transition-all ${
            activeMarks.alignRight
              ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => onCommand && onCommand('setTextAlign', 'justify')}
          className={`w-[34px] h-[34px] flex items-center justify-center rounded-lg text-xs transition-all ${
            activeMarks.alignJustify
              ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Justify"
        >
          <AlignJustify className="w-4 h-4" />
        </button>
      </div>

      {/* Divider */}
      <div className="w-[1px] h-5 bg-slate-200 mx-0.5" />

      {/* 5. Insert Annotations & Media */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => {
            const url = window.prompt('Enter Link URL:');
            if (url && onCommand) {
              onCommand('setLink', { href: url });
            }
          }}
          className="w-[34px] h-[34px] flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 transition-all"
          title="Insert Link"
        >
          <Link2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => {
            const url = window.prompt('Enter Image URL:');
            if (url && onCommand) {
              onCommand('setImage', { src: url });
            }
          }}
          className="w-[34px] h-[34px] flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 transition-all"
          title="Insert Image"
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => onCommand && onCommand('insertComment')}
          className="w-[34px] h-[34px] flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 transition-all"
          title="Add Comment to Selection"
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => onCommand && onCommand('insertTable', { rows: 3, cols: 3, withHeaderRow: true })}
          className="w-[34px] h-[34px] flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 transition-all"
          title="Insert Table"
        >
          <TableIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Divider */}
      <div className="w-[1px] h-5 bg-slate-200 mx-0.5" />

      {/* 6. Undo / Redo */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => onCommand && onCommand('undo')}
          className="w-[34px] h-[34px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => onCommand && onCommand('redo')}
          className="w-[34px] h-[34px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
