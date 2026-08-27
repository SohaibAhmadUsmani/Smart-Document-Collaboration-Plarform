import React, { useState, useEffect, useRef } from 'react';
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Table,
  Code,
  Quote,
  Paperclip,
  Minus,
} from 'lucide-react';

export const SLASH_COMMAND_ITEMS = [
  {
    id: 'h1',
    title: 'Heading 1',
    description: 'Large section heading',
    icon: Heading1,
    category: 'Basic Blocks',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    id: 'h2',
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: Heading2,
    category: 'Basic Blocks',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: 'h3',
    title: 'Heading 3',
    description: 'Small subsection heading',
    icon: Heading3,
    category: 'Basic Blocks',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    id: 'bulletList',
    title: 'Bullet List',
    description: 'Unordered bulleted list',
    icon: List,
    category: 'Lists',
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    id: 'orderedList',
    title: 'Numbered List',
    description: 'Ordered numbered list',
    icon: ListOrdered,
    category: 'Lists',
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    id: 'taskList',
    title: 'Task Checklist',
    description: 'Interactive tasks with checkboxes',
    icon: CheckSquare,
    category: 'Lists',
    command: (editor) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    id: 'table',
    title: 'Table',
    description: 'Insert a 3x3 table with headers',
    icon: Table,
    category: 'Advanced',
    command: (editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    id: 'codeBlock',
    title: 'Code Block',
    description: 'Syntax-highlighted code block',
    icon: Code,
    category: 'Advanced',
    command: (editor) => editor.chain().focus().toggleCodeBlock({ language: 'javascript' }).run(),
  },
  {
    id: 'callout',
    title: 'Callout Box',
    description: 'Highlighted notice / alert box',
    icon: Quote,
    category: 'Advanced',
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    id: 'divider',
    title: 'Divider',
    description: 'Horizontal line separator',
    icon: Minus,
    category: 'Basic Blocks',
    command: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
];

export function SlashCommandMenu({ editor, isOpen, onClose, query = '', position = { top: 0, left: 0 } }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef(null);

  const filteredItems = SLASH_COMMAND_ITEMS.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.description.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].command(editor);
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredItems, editor, onClose]);

  if (!isOpen || filteredItems.length === 0) return null;

  return (
    <div
      ref={menuRef}
      style={{ top: `${position.top + 28}px`, left: `${position.left}px` }}
      className="fixed z-50 w-72 max-h-80 overflow-y-auto bg-white/98 backdrop-blur-md rounded-xl shadow-2xl border border-slate-200 p-1.5 animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="px-2 py-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
        Basic & Advanced Blocks
      </div>
      {filteredItems.map((item, idx) => {
        const Icon = item.icon;
        const isSelected = idx === selectedIndex;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              item.command(editor);
              onClose();
            }}
            onMouseEnter={() => setSelectedIndex(idx)}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors ${
              isSelected
                ? 'bg-blue-50 text-blue-900 font-medium'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className={`p-1.5 rounded-md ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-800 truncate">{item.title}</div>
              <div className="text-[10px] text-slate-500 truncate">{item.description}</div>
            </div>
          </button>
        );
      })}
    </div>

  );
}
