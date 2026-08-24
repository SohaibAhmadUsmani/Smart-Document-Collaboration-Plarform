/**
 * Comment Anchor Data Contracts for ProseMirror text-range and block-level discussions.
 */

export const ANCHOR_TYPES = {
  TEXT_SELECTION: 'text_selection',
  BLOCK_NODE: 'block_node',
};

/**
 * Creates a structured comment anchor payload for Ayyan's comments module.
 *
 * @param {Object} params
 * @param {string} params.documentId
 * @param {'text_selection' | 'block_node'} params.anchorType
 * @param {number} [params.from]
 * @param {number} [params.to]
 * @param {string} [params.exactQuote]
 * @param {string} [params.prefixContext]
 * @param {string} [params.suffixContext]
 * @param {string} [params.blockId]
 * @returns {Object}
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
