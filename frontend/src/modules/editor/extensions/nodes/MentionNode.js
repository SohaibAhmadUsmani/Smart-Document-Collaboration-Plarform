/**
 * @file MentionNode.js
 * @description ProseMirror inline atom node extension for @user mentions.
 * Interoperates with Ayyan's Notifications and Comments modules.
 * @module frontend/src/modules/editor/extensions/nodes/MentionNode
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh inline atom node hai jo document ke text mein `@username` tags ko render karta hai
 * aur `userId` attribute store karta hai taake user tagging aur notification triggering possible ho.
 */

import { Node, mergeAttributes } from '@tiptap/core';

/**
 * Custom User Mention Inline Atom Node.
 *
 * [ROMAN URDU]:
 * TipTap Node schema jo userId aur username attributes manage karta hai.
 */
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
