import { Node, mergeAttributes } from '@tiptap/core';

export const MentionNode = Node.create({
  name: 'mention',
  group: 'inline',
  inline: true,
  selectable: false,
  atom: true,

  addAttributes() {
    return {
      userId: { default: null },
      username: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-mention-id]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-editor-node': 'mention',
        'data-mention-id': HTMLAttributes.userId,
      }),
      `@${HTMLAttributes.username || 'user'}`,
    ];
  },
});
