import { DocumentModel } from './document.model.js';

/**
 * Searches across document ProseMirror / TipTap AST structures within a workspace.
 *
 * @param {string} workspaceId - Workspace ID
 * @param {Object} criteria - Search options
 * @param {string} [criteria.query] - Text search query (case-insensitive)
 * @param {string[]} [criteria.nodeTypes] - Filter by node types: ['heading', 'codeBlock', 'table', 'callout', 'taskList']
 * @param {string[]} [criteria.tags] - Document tags filter
 * @param {number} [criteria.limit=20] - Maximum documents to return
 * @returns {Promise<Array>} List of matching documents with snippet excerpts and AST paths
 */
export async function searchContentAst(workspaceId, criteria = {}) {
  const { query, nodeTypes = [], tags = [], limit = 20 } = criteria;

  const mongoQuery = { workspaceId, isArchived: false };
  if (Array.isArray(tags) && tags.length > 0) {
    mongoQuery.tags = { $in: tags };
  }

  const documents = await DocumentModel.find(mongoQuery)
    .select('id title icon folderId content updatedAt tags')
    .lean()
    .exec();

  const results = [];
  const regex = query && typeof query === 'string' && query.trim() ? new RegExp(query.trim(), 'i') : null;

  for (const doc of documents) {
    const matches = [];
    traverseAst(doc.content, (node, path) => {
      // Filter by node type if specified
      if (nodeTypes.length > 0 && !nodeTypes.includes(node.type)) {
        return;
      }

      // Check regex text match
      if (regex) {
        const textContent = extractNodeText(node);
        if (regex.test(textContent)) {
          matches.push({
            nodeType: node.type,
            attrs: node.attrs || {},
            snippet: getMatchedSnippet(textContent, regex),
            astPath: path.join('.'),
          });
        }
      } else if (nodeTypes.includes(node.type)) {
        matches.push({
          nodeType: node.type,
          attrs: node.attrs || {},
          snippet: extractNodeText(node).slice(0, 120),
          astPath: path.join('.'),
        });
      }
    });

    if (matches.length > 0) {
      results.push({
        documentId: doc._id,
        title: doc.title,
        icon: doc.icon,
        folderId: doc.folderId,
        tags: doc.tags,
        updatedAt: doc.updatedAt,
        matchCount: matches.length,
        matches: matches.slice(0, 5), // Return top 5 matching blocks
      });
    }

    if (results.length >= limit) break;
  }

  return results;
}

function traverseAst(node, visitor, currentPath = ['root']) {
  if (!node || typeof node !== 'object') return;
  visitor(node, currentPath);

  if (Array.isArray(node.content)) {
    node.content.forEach((child, index) => {
      traverseAst(child, visitor, [...currentPath, `content[${index}]`]);
    });
  }
}

function extractNodeText(node) {
  if (!node) return '';
  if (node.type === 'text') return node.text || '';
  if (Array.isArray(node.content)) return node.content.map(extractNodeText).join(' ');
  return '';
}

function getMatchedSnippet(text, regex, windowSize = 80) {
  const match = regex.exec(text);
  if (!match) return text.slice(0, windowSize);
  const start = Math.max(0, match.index - windowSize / 2);
  const end = Math.min(text.length, match.index + match[0].length + windowSize / 2);
  return (start > 0 ? '...' : '') + text.slice(start, end).trim() + (end < text.length ? '...' : '');
}
