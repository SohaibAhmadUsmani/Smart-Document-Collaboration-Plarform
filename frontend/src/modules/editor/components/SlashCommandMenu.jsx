/**
 * @file SlashCommandMenu.jsx
 * @description Quick insertion slash command palette popover menu component for DocSync Pro.
 * Triggered by typing `/` to quickly insert headings, lists, tables, callouts, code blocks, or attachments.
 * @module frontend/src/modules/editor/components/SlashCommandMenu
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Jab user document canvas mein `/` type karta hai toh yeh floating command menu open hota hai.
 * Arrow up/down se options navigate hoti hain aur Enter dabane par target node (heading,
 * table, callout, checklist, code block) insert ho jata hai.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Table,
  Paperclip,
  Image,
} from 'lucide-react';

const SLASH_COMMANDS = [
  {
    id: 'h1',
    title: 'Heading 1',
    description: 'Big section heading',
    icon: Heading1,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    id: 'h2',
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: Heading2,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: 'h3',
    title: 'Heading 3',
    description: 'Small subsection heading',
    icon: Heading3,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    id: 'bullet_list',
    title: 'Bullet List',
    description: 'Create a simple bulleted list',
    icon: List,
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    id: 'ordered_list',
    title: 'Numbered List',
    description: 'Create a numbered list sequence',
    icon: ListOrdered,
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    id: 'task_list',
    title: 'Task Checklist',
    description: 'Track tasks with checkboxes',
    icon: CheckSquare,
    command: (editor) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    id: 'callout',
    title: 'Callout / Quote',
    description: 'Highlight important notice or quote',
    icon: Quote,
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    id: 'code_block',
    title: 'Code Block',
    description: 'Syntax highlighted code snippet',
    icon: Code,
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: 'table',
    title: 'Table',
    description: 'Insert a 3x3 editable table',
    icon: Table,
    command: (editor) =>
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    id: 'image',
    title: 'Image',
    description: 'Embed image from URL',
    icon: Image,
    command: (editor) => {
      const url = window.prompt('Enter image URL:');
      if (url) editor.chain().focus().setImage({ src: url }).run();
    },
  },
];

/**
 * Slash Command Popover Menu.
 *
 * [ROMAN URDU]:
 * Floating slash command menu component.
 *
 * @param {Object} props
 * @param {Object} props.editor - TipTap editor instance
 * @param {boolean} props.isOpen - Menu visibility
 * @param {string} props.query - Filter query text
 * @param {Object} props.position - Coordinates { top, left }
 * @param {Function} props.onClose - Close callback
 * @returns {React.JSX.Element|null}
 */
export function SlashCommandMenu({
  editor,
  isOpen,
  query = '',
  position = { top: 0, left: 0 },
  onClose,
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef(null);

  const filteredCommands = SLASH_COMMANDS.filter((cmd) =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.description.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation listener (ArrowUp, ArrowDown, Enter)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          executeSelection(filteredCommands[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands]);

  const executeSelection = (cmd) => {
    if (!editor || !cmd) return;
    cmd.command(editor);
    onClose();
  };

  if (!isOpen || filteredCommands.length === 0) return null;

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Quick insert commands"
      style={{
        position: 'fixed',
        top: `${Math.min(window.innerHeight - 320, position.top + 24)}px`,
        left: `${Math.min(window.innerWidth - 300, Math.max(20, position.left))}px`,
      }}
      className="z-50 w-72 max-h-72 overflow-y-auto bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 py-1 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
        Basic Blocks
      </div>

      {filteredCommands.map((cmd, index) => {
        const Icon = cmd.icon;
        const isSelected = index === selectedIndex;

        return (
          <button
            key={cmd.id}
            type="button"
            role="menuitem"
            onClick={() => executeSelection(cmd)}
            onMouseEnter={() => setSelectedIndex(index)}
            className={`w-full text-left px-3 py-2 flex items-center gap-2.5 transition-colors ${
              isSelected
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <div
              className={`p-1.5 rounded-lg border ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">{cmd.title}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">{cmd.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default SlashCommandMenu;
