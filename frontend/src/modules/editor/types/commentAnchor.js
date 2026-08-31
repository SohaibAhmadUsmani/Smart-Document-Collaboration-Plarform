/**
 * @file commentAnchor.js
 * @description Comment Anchor data contracts for ProseMirror text range and block discussions.
 * Interoperates with Ayyan's Comments Module.
 * @module frontend/src/modules/editor/types/commentAnchor
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh file Ayyan ke comments module ke sath integrate hone wale comment anchor contracts define karti hai.
 * Text selection range (from, to, exactQuote, prefix/suffix context) aur block-level anchors create karti hai.
 */

/**
 * Anchor categorization types.
 *
 * [ROMAN URDU]:
 * Comment anchor ke types: inline text selection ya block node.
 */
export const ANCHOR_TYPES = {
  TEXT_SELECTION: 'text_selection',
  BLOCK_NODE: 'block_node',
};

/**
 * Creates a structured comment anchor payload for comment discussions.
 *
 * [ROMAN URDU]:
 * Comment anchor ka payload object create karta hai jisme text position, quote, aur context saved hota hai.
 *
 * @param {Object} params - Anchor parameters
 * @param {string} params.documentId - Document ObjectId
 * @param {'text_selection' | 'block_node'} [params.anchorType='text_selection'] - Type of anchor
 * @param {number} [params.from=0] - Start character offset
 * @param {number} [params.to=0] - End character offset
 * @param {string} [params.exactQuote=''] - Highlighted text snippet
 * @param {string} [params.prefixContext=''] - Text preceding selection for fuzzy matching
 * @param {string} [params.suffixContext=''] - Text following selection for fuzzy matching
 * @param {string|null} [params.blockId=null] - Target block ID
 * @returns {Object} Structured comment anchor object
 */
export function createCommentAnchor(params) {
  return {
    documentId: params.documentId,
    anchorType: params.anchorType || ANCHOR_TYPES.TEXT_SELECTION,
    from: params.from || 0,
    to: params.to || 0,
    exactQuote: params.exactQuote || '',
    prefixContext: params.prefixContext || '',
    suffixContext: params.suffixContext || '',
    blockId: params.blockId || null,
    createdAt: new Date().toISOString(),
  };
}
