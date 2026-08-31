/**
 * @file CalloutNode.js
 * @description ProseMirror block node extension for Callout / Alert notices in DocSync Pro.
 * Supports info, warning, success, and danger callout styles.
 * @module frontend/src/modules/editor/extensions/nodes/CalloutNode
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh custom ProseMirror container node hai jo `<aside data-callout-type="..."/>` render karta hai.
 * Important alerts, quotes, aur notice boxes ke liye istemal hota hai.
 */

import { Node, mergeAttributes } from '@tiptap/core';

/**
 * Custom Callout / Notice Block Node.
 *
 * [ROMAN URDU]:
 * TipTap Node schema jo callout type (info, warning, etc.) aur unique blockId ko track karta hai.
 */
export const CalloutNode = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      type: {
        default: 'info',
        parseHTML: (element) => element.getAttribute('data-callout-type') || 'info',
        renderHTML: (attributes) => ({
          'data-callout-type': attributes.type,
        }),
      },
      blockId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-block-id'),
        renderHTML: (attributes) => ({
          'data-block-id': attributes.blockId,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'aside[data-callout-type]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'aside',
      mergeAttributes(HTMLAttributes, {
        'data-editor-node': 'callout',
      }),
      0,
    ];
  },
});
