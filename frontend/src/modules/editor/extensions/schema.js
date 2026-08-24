import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table, TableRow, TableCell, TableHeader } from './nodes/TableNodes.js';
import { CalloutNode } from './nodes/CalloutNode.js';
import { AttachmentNode } from './nodes/AttachmentNode.js';
import { CodeBlockNode } from './nodes/CodeBlockNode.js';
import { MentionNode } from './nodes/MentionNode.js';
import { CommentMark } from './marks/CommentMark.js';

/**
 * Complete Extension Bundle for the Document Editor Module.
 * Matches all required block types in Section 3 of the PDF specification.
 */
export function getEditorExtensions(options = {}) {
  return [
    StarterKit.configure({
      codeBlock: false, // Replaced by custom CodeBlockNode
      dropcursor: { color: 'currentColor', width: 2 },
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        'data-editor-link': 'true',
        rel: 'noopener noreferrer',
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
