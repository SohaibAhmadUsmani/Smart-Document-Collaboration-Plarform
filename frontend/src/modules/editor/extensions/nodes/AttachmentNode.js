/**
 * @file AttachmentNode.js
 * @description ProseMirror block node extension for embedded file attachments in DocSync Pro.
 * @module frontend/src/modules/editor/extensions/nodes/AttachmentNode
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh TipTap custom atom block node hai jo document ke andar uploaded files (PDF, DOCX, etc.)
 * ki visual representation render karta hai.
 */

import { Node, mergeAttributes } from '@tiptap/core';

/**
 * Custom File Attachment Block Node.
 *
 * [ROMAN URDU]:
 * TipTap Node schema jo fileId, filename, url, fileSize, aur mimeType attributes ko manage karta hai.
 */
export const AttachmentNode = Node.create({
  name: 'fileAttachment',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      fileId: { default: null },
      filename: { default: 'Attachment' },
      url: { default: '#' },
      fileSize: { default: 0 },
      mimeType: { default: 'application/octet-stream' },
      blockId: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-editor-node="attachment"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-editor-node': 'attachment',
      }),
      ['span', { class: 'attachment-icon' }, '📎'],
      ['span', { class: 'attachment-name' }, HTMLAttributes.filename || 'Attachment'],
    ];
  },
});
