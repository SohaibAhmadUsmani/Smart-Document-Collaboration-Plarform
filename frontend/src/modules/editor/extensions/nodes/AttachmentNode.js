import { Node, mergeAttributes } from '@tiptap/core';

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
