/**
 * Traverses a TipTap / ProseMirror AST and extracts Table of Contents (TOC) headings.
 *
 * @param {Object} documentAst - Document JSON AST
 * @returns {Array<{ level: number, text: string, blockId: string }>}
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
 * @param {Object} documentAst
 * @param {string} nodeType
 * @returns {Array<Object>}
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

/**
 * Extracts plain text from an individual AST node.
 *
 * @param {Object} node
 * @returns {string}
 */
export function extractNodeText(node) {
  if (!node) return '';
  if (node.type === 'text') return node.text || '';
  if (Array.isArray(node.content)) return node.content.map(extractNodeText).join(' ');
  return '';
}
