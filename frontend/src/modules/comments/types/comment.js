/**
 * Comment Type Definitions
 *
 * Data shapes matching the backend Comment schema.
 * See: backend/src/modules/comments/models/Comment.js
 */

/**
 * @typedef {'text_selection' | 'block_node'} AnchorType
 */

/**
 * @typedef {Object} CommentAuthor
 * @property {string} _id - User ID
 * @property {string} name - User display name
 * @property {string} email - User email
 */

/**
 * @typedef {Object} Comment
 * @property {string} _id - Comment ID
 * @property {CommentAuthor | string} author - Populated user or user ID string
 * @property {string} document - Document ID this comment belongs to
 * @property {string} body - Comment text content
 * @property {boolean} resolved - Whether the comment thread is resolved
 * @property {string | null} parentComment - Parent comment ID (for replies)
 * @property {AnchorType} anchorType - Type of anchor (text_selection or block_node)
 * @property {number} from - Start position in document (for text_selection)
 * @property {number} to - End position in document (for text_selection)
 * @property {string} exactQuote - Selected text at time of comment creation
 * @property {string} prefixContext - Text before selection for fuzzy matching
 * @property {string} suffixContext - Text after selection for fuzzy matching
 * @property {string | null} blockId - Block ID (for block_node anchor)
 * @property {string[]} mentions - Array of mentioned user IDs
 * @property {string} createdAt - ISO timestamp
 * @property {string} updatedAt - ISO timestamp
 */

/**
 * @typedef {Object} CreateCommentPayload
 * @property {string} documentId - Document ID
 * @property {string} body - Comment text
 * @property {AnchorType} anchorType - Anchor type
 * @property {number} from - Start position
 * @property {number} to - End position
 * @property {string} [exactQuote] - Selected text
 * @property {string} [prefixContext] - Preceding context
 * @property {string} [suffixContext] - Following context
 * @property {string} [blockId] - Block ID for block_node
 * @property {string[]} [mentions] - User IDs to mention
 * @property {string} [parentComment] - Parent comment ID for replies
 */

export const ANCHOR_TYPES = {
  TEXT_SELECTION: 'text_selection',
  BLOCK_NODE: 'block_node',
};

export default ANCHOR_TYPES;
