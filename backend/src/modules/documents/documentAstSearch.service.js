import { DocumentModel } from './document.model.js';

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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
    .limit(limit * 2)
    .lean()
    .exec();

  const results = [];
  const regex =
    query && typeof query === 'string' && query.trim()
      ? new RegExp(escapeRegex(query.trim()), 'i')
      : null;

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
        if (textContent && regex.test(textContent)) {
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
        documentId: doc._id.toString(),
        title: doc.title,
        icon: doc.icon,
        folderId: doc.folderId,
        tags: doc.tags,
        matchCount: matches.length,
        matches: matches.slice(0, 5),
        updatedAt: doc.updatedAt,
      });
    }

    if (results.length >= limit) break;
  }

  return results;
}

function traverseAst(node, callback, currentPath = []) {
  if (!node || typeof node !== 'object') return;

  callback(node, currentPath);

  if (Array.isArray(node.content)) {
    node.content.forEach((child, index) => {
      traverseAst(child, callback, [...currentPath, `content[${index}]`]);
    });
  }
}

function extractNodeText(node) {
  if (!node) return '';
  if (node.type === 'text' && typeof node.text === 'string') {
    return node.text;
  }
  if (Array.isArray(node.content)) {
    return node.content.map(extractNodeText).join(' ');
  }
  return '';
}

function getMatchedSnippet(text, regex, radius = 40) {
  const match = regex.exec(text);
  if (!match) return text.slice(0, radius * 2);

  const start = Math.max(0, match.index - radius);
  const end = Math.min(text.length, match.index + match[0].length + radius);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < text.length ? '...' : '';

  return `${prefix}${text.slice(start, end)}${suffix}`;
}
