import React from 'react';

/**
 * Rich Text Editor Toolbar providing formatting controls for Section 3 of PDF spec:
 * Headings (H1, H2, H3, Paragraph), Bold, Italic, Underline, Strikethrough,
 * Code Block, Blockquote, Bullet List, Numbered List, Task List, Table, Link.
 *
 * @param {Object} props
 * @param {Function} [props.onCommand] - Callback triggered when a toolbar button is clicked (e.g. ('bold'), ('heading', {level: 1}))
 * @param {Object} [props.activeMarks] - Object tracking active formatting marks (e.g. { bold: true, heading1: false })
 * @param {boolean} [props.isReadOnly=false] - If true, toolbar is disabled
 */
export function EditorToolbar({
  onCommand,
  activeMarks = {},
  isReadOnly = false,
}) {
  const handleAction = (command, payload) => {
    if (isReadOnly || !onCommand) return;
    onCommand(command, payload);
  };

  const btnClass = (isActive) =>
    `px-2.5 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1 ${
      isActive
        ? 'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-white font-semibold'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
    } disabled:opacity-40 disabled:cursor-not-allowed`;

  return (
    <div
      role="toolbar"
      aria-label="Editor formatting toolbar"
      className="flex flex-wrap items-center gap-1 px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10"
    >
      {/* Headings & Paragraph */}
      <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200 dark:border-slate-700">
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => handleAction('paragraph')}
          className={btnClass(activeMarks.paragraph)}
          title="Normal Paragraph"
        >
          Text
        </button>
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => handleAction('heading', { level: 1 })}
          className={btnClass(activeMarks.h1)}
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => handleAction('heading', { level: 2 })}
          className={btnClass(activeMarks.h2)}
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => handleAction('heading', { level: 3 })}
          className={btnClass(activeMarks.h3)}
          title="Heading 3"
        >
          H3
        </button>
      </div>

      {/* Inline Formatting (Bold, Italic, Underline, Strike, Code) */}
      <div className="flex items-center gap-0.5 px-2 border-r border-slate-200 dark:border-slate-700">
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => handleAction('bold')}
          className={btnClass(activeMarks.bold)}
          title="Bold (Ctrl+B)"
        >
          <span className="font-bold">B</span>
        </button>
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => handleAction('italic')}
          className={btnClass(activeMarks.italic)}
          title="Italic (Ctrl+I)"
        >
          <span className="italic font-serif">I</span>
        </button>
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => handleAction('underline')}
          className={btnClass(activeMarks.underline)}
          title="Underline (Ctrl+U)"
        >
          <span className="underline">U</span>
        </button>
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => handleAction('strike')}
          className={btnClass(activeMarks.strike)}
          title="Strikethrough"
        >
          <span className="line-through">S</span>
        </button>
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => handleAction('code')}
          className={btnClass(activeMarks.code)}
          title="Inline Code"
        >
          <span className="font-mono text-[11px]">&lt;/&gt;</span>
        </button>
      </div>

      {/* Lists (Bullet, Numbered, Task) */}
      <div className="flex items-center gap-0.5 px-2 border-r border-slate-200 dark:border-slate-700">
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => handleAction('bulletList')}
          className={btnClass(activeMarks.bulletList)}
          title="Bullet List"
        >
          <span>• List</span>
        </button>
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => handleAction('orderedList')}
          className={btnClass(activeMarks.orderedList)}
          title="Numbered List"
        >
          <span>1. List</span>
        </button>
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => handleAction('taskList')}
          className={btnClass(activeMarks.taskList)}
          title="Task Checklist"
        >
          <span>☑ Task</span>
        </button>
      </div>

      {/* Blocks (Blockquote, Code Block, Table, Divider) */}
      <div className="flex items-center gap-0.5 pl-2">
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => handleAction('blockquote')}
          className={btnClass(activeMarks.blockquote)}
          title="Blockquote"
        >
          <span>“ Quote</span>
        </button>
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => handleAction('codeBlock')}
          className={btnClass(activeMarks.codeBlock)}
          title="Code Block"
        >
          <span className="font-mono text-[11px]">{`{ }`} Code</span>
        </button>
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => handleAction('table')}
          className={btnClass(activeMarks.table)}
          title="Insert Table"
        >
          <span>⊞ Table</span>
        </button>
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => handleAction('horizontalRule')}
          className={btnClass(false)}
          title="Insert Divider"
        >
          <span>― Divider</span>
        </button>
      </div>
    </div>
  );
}
