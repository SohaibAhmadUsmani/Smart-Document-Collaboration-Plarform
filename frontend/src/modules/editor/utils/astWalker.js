/**
 * @file astWalker.js
 * @description AST traversal, node search, and Table of Contents (TOC) extraction helpers.
 * Iterates through ProseMirror / TipTap node trees to find target elements and headings.
 * @module frontend/src/modules/editor/utils/astWalker
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh file TipTap / ProseMirror AST ko traverse karne ke utility functions provide karti hai.
 * Heading outline (Table of Contents), specific node types dhoondne, aur node text extract karne ke kaam aati hai.
 */

/**
 * Extracts plain text from an individual AST node or sub-tree.
 *
 * [ROMAN URDU]:
 * Kisi specific AST node se plain text nikaalta hai space-separated string ke tor par.
 *
 * @param {Object} node - AST Node
 * @returns {string} Plain text content
 */
export function extractNodeText(node) {
  if (!node) return '';
  if (node.type === 'text') return node.text || '';
  if (Array.isArray(node.content)) return node.content.map(extractNodeText).join(' ');
  return '';
}

/**
 * Traverses a TipTap / ProseMirror AST and extracts Table of Contents (TOC) headings (H1-H6).
 *
 * [ROMAN URDU]:
 * Document AST se tamam heading blocks (H1 se H6) collect karta hai taake DocumentOutline component
 * mein clickable Table of Contents render ho sake.
 *
 * @param {Object} documentAst - Document JSON AST
 * @returns {Array<{ level: number, text: string, blockId: string }>} Heading list
 */
export function extractHeadingsOutline(documentAst) {
  if (!documentAst || !Array.isArray(documentAst.content)) return [];

  const outline = [];

  for (const node of documentAst.content) {
    if (node && node.type === 'heading') {
      const level = Math.min(6, Math.max(1, node.attrs?.level || 1));
      const text = extractNodeText(node).trim();
      const blockId = node.attrs?.blockId || `heading_${outline.length + 1}`;
      outline.push({ level, text, blockId });
    }
  }

  return outline;
}

/**
 * Traverses AST to find all nodes of a specific type (e.g. 'codeBlock', 'table', 'callout').
 *
 * [ROMAN URDU]:
 * AST ke andar kisi khaas type ke tamam nodes (jaise 'table' ya 'codeBlock') dhoond kar array mein return karta hai.
 *
 * @param {Object} documentAst - Document JSON AST
 * @param {string} nodeType - Target node type identifier
 * @returns {Array<Object>} Matching AST nodes
 */
export function findNodesByType(documentAst, nodeType) {
  const matches = [];

  function traverse(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === nodeType) {
      matches.push(node);
    }
    if (Array.isArray(node.content)) {
      node.content.forEach(traverse);
    }
  }

  traverse(documentAst);
  return matches;
}
