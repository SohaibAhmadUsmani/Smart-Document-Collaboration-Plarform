/**
 * @file EditorToolbar.jsx
 * @description Formatting toolbar for rich-text editing commands.
 * Connects buttons with the TipTap editor instance and active mark indicators.
 * @module frontend/src/modules/editor/components/EditorToolbar
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh document editor ki standard formatting toolbar hai jo text styling buttons
 * (bold, italic, strike, code, headings, lists, blockquote) render karti hai.
 */

import React from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link,
  Image,
  Table,
  Undo,
  Redo,
  MessageSquarePlus,
} from 'lucide-react';

/**
 * Main editor formatting toolbar.
 *
 * [ROMAN URDU]:
 * Toolbar component jo formatting commands execute karne ke buttons display karta hai.
 *
 * @param {Object} props
 * @param {Function} props.onCommand - Function to execute formatting commands
 * @param {Object} props.activeMarks - Currently active marks on cursor selection
 * @param {boolean} [props.isReadOnly=false] - Whether editing is disabled
 * @returns {React.JSX.Element}
 */
export function EditorToolbar({ onCommand, activeMarks = {}, isReadOnly = false }) {
  const btnClass = (isActive) =>
    `p-1.5 rounded text-sm transition-colors ${
      isActive
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-semibold'
        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
    } disabled:opacity-50 disabled:cursor-not-allowed`;

  return (
    <div
      role="toolbar"
      aria-label="Editor formatting"
      className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
    >
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => onCommand('toggleBold')}
          className={btnClass(activeMarks.bold)}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => onCommand('toggleItalic')}
          className={btnClass(activeMarks.italic)}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => onCommand('toggleUnderline')}
          className={btnClass(activeMarks.underline)}
          title="Underline (Ctrl+U)"
        >
          <Underline className="w-4 h-4" />
        </button>
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => onCommand('toggleStrike')}
          className={btnClass(activeMarks.strike)}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => onCommand('toggleCode')}
          className={btnClass(activeMarks.code)}
          title="Inline Code"
        >
          <Code className="w-4 h-4" />
        </button>
      </div>

      <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

      <div className="flex items-center gap-0.5">
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => onCommand('toggleHeading', { level: 1 })}
          className={btnClass(activeMarks.h1)}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => onCommand('toggleHeading', { level: 2 })}
          className={btnClass(activeMarks.h2)}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => onCommand('toggleHeading', { level: 3 })}
          className={btnClass(activeMarks.h3)}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>
      </div>

      <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

      <div className="flex items-center gap-0.5">
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => onCommand('toggleBulletList')}
          className={btnClass(activeMarks.bulletList)}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => onCommand('toggleOrderedList')}
          className={btnClass(activeMarks.orderedList)}
          title="Ordered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => onCommand('toggleTaskList')}
          className={btnClass(activeMarks.taskList)}
          title="Task List"
        >
          <CheckSquare className="w-4 h-4" />
        </button>
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => onCommand('toggleBlockquote')}
          className={btnClass(activeMarks.blockquote)}
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </button>
      </div>

      <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

      <div className="flex items-center gap-0.5">
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => onCommand('setTextAlign', 'left')}
          className={btnClass(activeMarks.alignLeft)}
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => onCommand('setTextAlign', 'center')}
          className={btnClass(activeMarks.alignCenter)}
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => onCommand('setTextAlign', 'right')}
          className={btnClass(activeMarks.alignRight)}
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => onCommand('setTextAlign', 'justify')}
          className={btnClass(activeMarks.alignJustify)}
          title="Justify"
        >
          <AlignJustify className="w-4 h-4" />
        </button>
      </div>

      <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

      <div className="flex items-center gap-0.5">
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => {
            const url = window.prompt('Enter link URL:');
            if (url) onCommand('setLink', { href: url });
          }}
          className={btnClass(activeMarks.link)}
          title="Insert Link"
        >
          <Link className="w-4 h-4" />
        </button>
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => {
            const url = window.prompt('Enter image URL:');
            if (url) onCommand('setImage', { src: url });
          }}
          className={btnClass(false)}
          title="Insert Image"
        >
          <Image className="w-4 h-4" />
        </button>
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => onCommand('insertTable', { rows: 3, cols: 3 })}
          className={btnClass(activeMarks.table)}
          title="Insert Table"
        >
          <Table className="w-4 h-4" />
        </button>
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => onCommand('insertComment')}
          className={btnClass(false)}
          title="Add Comment to Selection"
        >
          <MessageSquarePlus className="w-4 h-4" />
        </button>
      </div>

      <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

      <div className="flex items-center gap-0.5 ml-auto">
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => onCommand('undo')}
          className={btnClass(false)}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => onCommand('redo')}
          className={btnClass(false)}
          title="Redo (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default EditorToolbar;
