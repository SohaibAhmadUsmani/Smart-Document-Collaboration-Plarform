/**
 * @file FormattingToolbar.jsx
 * @description Accessible, mobile-responsive rich-text formatting ribbon component for DocSync Pro.
 * Provides heading dropdown, inline styles (B, I, U, S), lists, alignment, media/link insertion, and undo/redo.
 * @module frontend/src/modules/editor/components/FormattingToolbar
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh toolbar document text ko format karne ke liye controls muhayya karti hai.
 * Choti screens par overflow roknay ke liye horizontal scrolling aur scrollbar-none diya gaya hai.
 * Buttons par click karne se ProseMirror cursor/focus khatam na ho is ke liye onMouseDown preventDefault
 * lagaya gaya hai. Tamam buttons par ARIA attributes (role, aria-pressed, aria-label) shamil hain.
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
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

/**
 * FormattingToolbar Component (DocSync Pro Ribbon).
 *
 * [ROMAN URDU]:
 * Rich-text formatting toolbar component.
 *
 * @param {Object} props
 * @param {Function} props.onCommand - Dispatch command to the TipTap editor
 * @param {Object} [props.activeMarks={}] - Object tracking active formatting marks at current cursor position
 * @param {boolean} [props.isReadOnly=false] - If true, all toolbar controls are disabled
 * @returns {React.JSX.Element}
 */
export function FormattingToolbar({
  onCommand,
  activeMarks = {},
  isReadOnly = false,
}) {
  const [styleDropdownOpen, setStyleDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on Escape key or outside click
  useEffect(() => {
    if (!styleDropdownOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setStyleDropdownOpen(false);
    };
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setStyleDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [styleDropdownOpen]);

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

  /**
   * Helper to prevent default mouse-down behavior so ProseMirror doesn't lose focus.
   * [ROMAN URDU]: Focus loss prevent karne ke liye helper function.
   */
  const handlePreventFocusLoss = (e) => {
    e.preventDefault();
  };

  return (
    <div
      role="toolbar"
      aria-label="Document Formatting Toolbar"
      className="mx-auto my-2 max-w-full w-fit flex items-center gap-1 p-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-lg shadow-slate-200/60 dark:shadow-black/40 select-none overflow-x-auto scrollbar-none sticky top-0 z-30 touch-pan-x"
    >
      {/* 1. Style Dropdown */}
      <div className="relative flex-shrink-0" ref={dropdownRef}>
        <button
          type="button"
          disabled={isReadOnly}
          onMouseDown={handlePreventFocusLoss}
          onClick={() => setStyleDropdownOpen((prev) => !prev)}
          aria-haspopup="listbox"
          aria-expanded={styleDropdownOpen}
          aria-label={`Current text style: ${currentStyle}. Click to change`}
          className="h-[34px] px-3 flex items-center gap-2 rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 outline-none"
        >
          <span>{currentStyle}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {styleDropdownOpen && (
          <div
            role="listbox"
            aria-label="Text styles"
            className="absolute top-10 left-0 z-50 w-44 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 py-1 text-xs text-slate-700 dark:text-slate-300 animate-in fade-in zoom-in-95 duration-100"
          >
            <button
              type="button"
              role="option"
              aria-selected={currentStyle === 'Normal Text'}
              onMouseDown={handlePreventFocusLoss}
              onClick={() => handleStyleSelect('setParagraph')}
              className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium text-slate-800 dark:text-slate-200"
            >
              Normal Text
            </button>
            <button
              type="button"
              role="option"
              aria-selected={currentStyle === 'Heading 1'}
              onMouseDown={handlePreventFocusLoss}
              onClick={() => handleStyleSelect('toggleHeading', { level: 1 })}
              className="w-full text-left px-3.5 py-2 font-extrabold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-900 dark:text-white"
            >
              Heading 1
            </button>
            <button
              type="button"
              role="option"
              aria-selected={currentStyle === 'Heading 2'}
              onMouseDown={handlePreventFocusLoss}
              onClick={() => handleStyleSelect('toggleHeading', { level: 2 })}
              className="w-full text-left px-3.5 py-2 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-900 dark:text-white"
            >
              Heading 2
            </button>
            <button
              type="button"
              role="option"
              aria-selected={currentStyle === 'Heading 3'}
              onMouseDown={handlePreventFocusLoss}
              onClick={() => handleStyleSelect('toggleHeading', { level: 3 })}
              className="w-full text-left px-3.5 py-2 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-800 dark:text-slate-200"
            >
              Heading 3
            </button>
            <button
              type="button"
              role="option"
              aria-selected={currentStyle === 'Code Block'}
              onMouseDown={handlePreventFocusLoss}
              onClick={() => handleStyleSelect('toggleCodeBlock')}
              className="w-full text-left px-3.5 py-2 font-mono text-[11px] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-800 dark:text-slate-200"
            >
              Code Block
            </button>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-700 mx-0.5 flex-shrink-0" aria-hidden="true" />

      {/* 2. Inline Styles Group (B, I, U, S) */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button
          type="button"
          disabled={isReadOnly}
          onMouseDown={handlePreventFocusLoss}
          onClick={() => onCommand && onCommand('toggleBold')}
          aria-pressed={Boolean(activeMarks.bold)}
          aria-label="Bold (Ctrl+B)"
          title="Bold (Ctrl+B)"
          className={`w-[34px] h-[34px] flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
            activeMarks.bold
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800 font-extrabold'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          type="button"
          disabled={isReadOnly}
          onMouseDown={handlePreventFocusLoss}
          onClick={() => onCommand && onCommand('toggleItalic')}
          aria-pressed={Boolean(activeMarks.italic)}
          aria-label="Italic (Ctrl+I)"
          title="Italic (Ctrl+I)"
          className={`w-[34px] h-[34px] flex items-center justify-center rounded-lg text-xs font-serif italic transition-all ${
            activeMarks.italic
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Italic className="w-4 h-4" />
        </button>

        <button
          type="button"
          disabled={isReadOnly}
          onMouseDown={handlePreventFocusLoss}
          onClick={() => onCommand && onCommand('toggleUnderline')}
          aria-pressed={Boolean(activeMarks.underline)}
          aria-label="Underline (Ctrl+U)"
          title="Underline (Ctrl+U)"
          className={`w-[34px] h-[34px] flex items-center justify-center rounded-lg text-xs transition-all ${
            activeMarks.underline
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Underline className="w-4 h-4" />
        </button>

        <button
          type="button"
          disabled={isReadOnly}
          onMouseDown={handlePreventFocusLoss}
          onClick={() => onCommand && onCommand('toggleStrike')}
          aria-pressed={Boolean(activeMarks.strike)}
          aria-label="Strikethrough"
          title="Strikethrough"
          className={`w-[34px] h-[34px] flex items-center justify-center rounded-lg text-xs transition-all ${
            activeMarks.strike
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Strikethrough className="w-4 h-4" />
        </button>
      </div>

      {/* Divider */}
      <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-700 mx-0.5 flex-shrink-0" aria-hidden="true" />

      {/* 3. Lists & Quote Group */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button
          type="button"
          disabled={isReadOnly}
          onMouseDown={handlePreventFocusLoss}
          onClick={() => onCommand && onCommand('toggleBulletList')}
          aria-pressed={Boolean(activeMarks.bulletList)}
          aria-label="Bullet List"
          title="Bullet List"
          className={`w-[34px] h-[34px] flex items-center justify-center rounded-lg text-xs transition-all ${
            activeMarks.bulletList
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <List className="w-4 h-4" />
        </button>

        <button
          type="button"
          disabled={isReadOnly}
          onMouseDown={handlePreventFocusLoss}
          onClick={() => onCommand && onCommand('toggleOrderedList')}
          aria-pressed={Boolean(activeMarks.orderedList)}
          aria-label="Numbered List"
          title="Numbered List"
          className={`w-[34px] h-[34px] flex items-center justify-center rounded-lg text-xs transition-all ${
            activeMarks.orderedList
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <button
          type="button"
          disabled={isReadOnly}
          onMouseDown={handlePreventFocusLoss}
          onClick={() => onCommand && onCommand('toggleTaskList')}
          aria-pressed={Boolean(activeMarks.taskList)}
          aria-label="Task Checklist"
          title="Task Checklist"
          className={`w-[34px] h-[34px] flex items-center justify-center rounded-lg text-xs transition-all ${
            activeMarks.taskList
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
        </button>

        <button
          type="button"
          disabled={isReadOnly}
          onMouseDown={handlePreventFocusLoss}
          onClick={() => onCommand && onCommand('toggleBlockquote')}
          aria-pressed={Boolean(activeMarks.blockquote)}
          aria-label="Callout Quote"
          title="Callout Quote"
          className={`w-[34px] h-[34px] flex items-center justify-center rounded-lg text-xs font-serif transition-all ${
            activeMarks.blockquote
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Quote className="w-4 h-4" />
        </button>
      </div>

      {/* Divider */}
      <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-700 mx-0.5 flex-shrink-0" aria-hidden="true" />

      {/* 4. Alignment Controls */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button
          type="button"
          disabled={isReadOnly}
          onMouseDown={handlePreventFocusLoss}
          onClick={() => onCommand && onCommand('setTextAlign', 'left')}
          aria-pressed={Boolean(activeMarks.alignLeft || (!activeMarks.alignCenter && !activeMarks.alignRight && !activeMarks.alignJustify))}
          aria-label="Align Left"
          title="Align Left"
          className={`w-[34px] h-[34px] flex items-center justify-center rounded-lg text-xs transition-all ${
            activeMarks.alignLeft || (!activeMarks.alignCenter && !activeMarks.alignRight && !activeMarks.alignJustify)
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <AlignLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          disabled={isReadOnly}
          onMouseDown={handlePreventFocusLoss}
          onClick={() => onCommand && onCommand('setTextAlign', 'center')}
          aria-pressed={Boolean(activeMarks.alignCenter)}
          aria-label="Align Center"
          title="Align Center"
          className={`w-[34px] h-[34px] flex items-center justify-center rounded-lg text-xs transition-all ${
            activeMarks.alignCenter
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <AlignCenter className="w-4 h-4" />
        </button>

        <button
          type="button"
          disabled={isReadOnly}
          onMouseDown={handlePreventFocusLoss}
          onClick={() => onCommand && onCommand('setTextAlign', 'right')}
          aria-pressed={Boolean(activeMarks.alignRight)}
          aria-label="Align Right"
          title="Align Right"
          className={`w-[34px] h-[34px] flex items-center justify-center rounded-lg text-xs transition-all ${
            activeMarks.alignRight
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <AlignRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          disabled={isReadOnly}
          onMouseDown={handlePreventFocusLoss}
          onClick={() => onCommand && onCommand('setTextAlign', 'justify')}
          aria-pressed={Boolean(activeMarks.alignJustify)}
          aria-label="Align Justify"
          title="Justify"
          className={`w-[34px] h-[34px] flex items-center justify-center rounded-lg text-xs transition-all ${
            activeMarks.alignJustify
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <AlignJustify className="w-4 h-4" />
        </button>
      </div>

      {/* Divider */}
      <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-700 mx-0.5 flex-shrink-0" aria-hidden="true" />

      {/* 5. Insert Annotations & Media */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button
          type="button"
          disabled={isReadOnly}
          onMouseDown={handlePreventFocusLoss}
          onClick={() => {
            const url = window.prompt('Enter Link URL:');
            if (url && onCommand) {
              onCommand('setLink', { href: url });
            }
          }}
          aria-label="Insert Link"
          title="Insert Link"
          className="w-[34px] h-[34px] flex items-center justify-center rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          <Link2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          disabled={isReadOnly}
          onMouseDown={handlePreventFocusLoss}
          onClick={() => {
            const url = window.prompt('Enter Image URL:');
            if (url && onCommand) {
              onCommand('setImage', { src: url });
            }
          }}
          aria-label="Insert Image"
          title="Insert Image"
          className="w-[34px] h-[34px] flex items-center justify-center rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        <button
          type="button"
          disabled={isReadOnly}
          onMouseDown={handlePreventFocusLoss}
          onClick={() => onCommand && onCommand('insertComment')}
          aria-label="Add Comment to Selection"
          title="Add Comment to Selection"
          className="w-[34px] h-[34px] flex items-center justify-center rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        <button
          type="button"
          disabled={isReadOnly}
          onMouseDown={handlePreventFocusLoss}
          onClick={() => onCommand && onCommand('insertTable', { rows: 3, cols: 3, withHeaderRow: true })}
          aria-label="Insert Table"
          title="Insert Table"
          className="w-[34px] h-[34px] flex items-center justify-center rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          <TableIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Divider */}
      <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-700 mx-0.5 flex-shrink-0" aria-hidden="true" />

      {/* 6. Undo / Redo */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button
          type="button"
          disabled={isReadOnly}
          onMouseDown={handlePreventFocusLoss}
          onClick={() => onCommand && onCommand('undo')}
          aria-label="Undo (Ctrl+Z)"
          title="Undo (Ctrl+Z)"
          className="w-[34px] h-[34px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          disabled={isReadOnly}
          onMouseDown={handlePreventFocusLoss}
          onClick={() => onCommand && onCommand('redo')}
          aria-label="Redo (Ctrl+Y)"
          title="Redo (Ctrl+Y)"
          className="w-[34px] h-[34px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default FormattingToolbar;
