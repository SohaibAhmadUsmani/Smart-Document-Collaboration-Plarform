import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table, TableRow, TableCell, TableHeader } from './nodes/TableNodes.js';
import { CalloutNode } from './nodes/CalloutNode.js';
import { AttachmentNode } from './nodes/AttachmentNode.js';
import { CodeBlockNode } from './nodes/CodeBlockNode.js';
import { MentionNode } from './nodes/MentionNode.js';
import { CommentMark } from './marks/CommentMark.js';

/**
 * Complete Extension Bundle for DocSync Pro Document Editor.
 * Matches all required block types in Section 3 of the SRS specification.
 */
export function getEditorExtensions(options = {}) {
  return [
    StarterKit.configure({
      codeBlock: false, // Custom CodeBlockNode used
      dropcursor: { color: '#2563eb', width: 2 },
    }),
    Underline,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
      alignments: ['left', 'center', 'right', 'justify'],
      defaultAlignment: 'left',
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        'data-editor-link': 'true',
        class: 'text-blue-600 underline font-medium cursor-pointer',
        rel: 'noopener noreferrer',
      },
    }),
    Image.configure({
      inline: true,
      allowBase64: true,
      HTMLAttributes: {
        class: 'rounded-lg max-w-full my-4 border border-slate-200 shadow-sm',
      },
    }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    CalloutNode,
    AttachmentNode,
    CodeBlockNode,
    MentionNode,
    CommentMark,
  ];
}
