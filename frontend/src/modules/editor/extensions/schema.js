/**
 * @file schema.js
 * @description Extension registry and ProseMirror schema bundle for the DocSync Pro TipTap editor.
 * Configures StarterKit, custom block nodes (Callouts, Tables, CodeBlocks, Attachments, Mentions),
 * and inline marks (Comments, Links, Underline).
 * @module frontend/src/modules/editor/extensions/schema
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh file TipTap editor ke tamam extensions aur custom ProseMirror nodes/marks ko register
 * aur configure karti hai. Link sanitization (#5) ke zariye javascript:, vbscript:, aur data: unsafe protocols ko strip kiya jata hai.
 */

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
import { FontFamilyMark } from './marks/FontFamilyMark.js';

/**
 * Checks whether a given URL is safe to embed as a hyperlink.
 * Strips javascript:, vbscript:, and unsafe data schemes.
 *
 * [ROMAN URDU]: URL safe hai ya nahi verify karta hai.
 *
 * @param {string} url
 * @returns {boolean}
 */
export function isValidLinkUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim().replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, '');
  if (!trimmed) return false;
  if (/^(javascript:|vbscript:|data:(?!image\/(png|jpeg|jpg|webp|gif)))/i.test(trimmed)) {
    return false;
  }
  return true;
}

/**
 * Sanitizes a URL string, returning safe link or '#' if unsafe.
 *
 * [ROMAN URDU]:
 * Unsafe URL ko sanitize karta hai taake XSS attack execute na ho sake.
 *
 * @param {string} url
 * @returns {string} Sanitized URL
 */
export function sanitizeLinkUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim().replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, '');
  if (!isValidLinkUrl(trimmed)) {
    console.warn(`[Security Warning]: Blocked potentially unsafe link scheme: ${url}`);
    return '';
  }
  if (!/^(https?:\/\/|mailto:|tel:|sms:|#|\/|\.\/|\.\.\/)/i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

/**
 * Builds the complete extension bundle array for the TipTap Editor instance.
 *
 * [ROMAN URDU]:
 * TipTap editor instance ke liye extensions array assemble karta hai. Dropcursor,
 * link click handling, custom codeBlock disabling, aur text alignment configure karta hai.
 *
 * @param {Object} [options={}] - Custom configuration options
 * @returns {Array<any>} Configured extension instances array
 */
export function getEditorExtensions(options = {}) {
  return [
    StarterKit.configure({
      codeBlock: false, // Custom CodeBlockNode used instead of default
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
      validate: (href) => isValidLinkUrl(href),
      HTMLAttributes: {
        'data-editor-link': 'true',
        class: 'text-blue-600 underline font-medium cursor-pointer hover:text-blue-800 transition-colors',
        rel: 'noopener noreferrer',
        target: '_blank',
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
    Table.configure({
      resizable: true,
      handleWidth: 5,
      cellMinWidth: 100,
      lastColumnResizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
    CalloutNode,
    AttachmentNode,
    CodeBlockNode,
    MentionNode,
    CommentMark,
    FontFamilyMark,
  ];
}
