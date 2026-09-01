/**
 * @file documentAstSearch.service.js
 * @description Deep ProseMirror / TipTap AST tree search and snippet extraction service.
 * Enables granular structural queries across headings, code blocks, tables, callouts, and task lists.
 * @module backend/src/modules/documents/documentAstSearch.service
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh service document ke TipTap AST structure ke andar deep search karti hai.
 * Sirf plain text search ke bajaye, yeh specific node types (jaise codeBlock, table, callout)
 * aur unke attributes ke sath exact AST path (`content[0].content[1]`) aur context snippet return karti hai.
 */

import { DocumentModel } from './document.model.js';

/**
 * Escapes regex special characters in user search query string to prevent ReDoS.
 * [Issue #45]: ReDoS regex escaping.
 *
 * [ROMAN URDU]:
 * User ki search string se regex ke special characters escape karta hai taake regex injection aur ReDoS na ho.
 *
 * @param {string} string - Raw search string
 * @returns {string} Escaped string safe for RegExp construction
 */
export function escapeRegex(string) {
  if (typeof string !== 'string') return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Recursively extracts plain text from an AST node for regex evaluation.
 *
 * [ROMAN URDU]:
 * Node ke text content ko recursively concatenate karta hai.
 *
 * @param {Object} node - AST Node
 * @returns {string} Text string
 */
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

/**
 * Generates an excerpt snippet with matched keywords centered with ellipsis.
 *
 * [ROMAN URDU]:
 * Matched text ke ird gird context window (radius 40 characters) bana kar excerpt snippet banata hai.
 *
 * @param {string} text - Full text of node
 * @param {RegExp} regex - Search regex
 * @param {number} [radius=40] - Context window size
 * @returns {string} Formatted snippet
 */
function getMatchedSnippet(text, regex, radius = 40) {
  const match = regex.exec(text);
  if (!match) return text.slice(0, radius * 2);

  const start = Math.max(0, match.index - radius);
  const end = Math.min(text.length, match.index + match[0].length + radius);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < text.length ? '...' : '';

  return `${prefix}${text.slice(start, end)}${suffix}`;
}

/**
 * Recursively traverses AST tree invoking a visitor callback with current node and path with depth guard.
 * [Issue #24]: Prevents call stack overflow on deep trees.
 *
 * [ROMAN URDU]:
 * AST tree ko traverse karke har child node ka address path track karta hai aur depth limit se stack overflow ko prevent karta hai.
 *
 * @param {Object} node - Current AST node
 * @param {Function} callback - (node, path) => void
 * @param {string[]} [currentPath=[]] - Breadcrumb path in JSON tree
 * @param {number} [depth=0] - Recursion depth
 */
function traverseAst(node, callback, currentPath = [], depth = 0) {
  if (!node || typeof node !== 'object' || depth > 30) return;

  callback(node, currentPath);

  if (Array.isArray(node.content)) {
    node.content.forEach((child, index) => {
      traverseAst(child, callback, [...currentPath, `content[${index}]`], depth + 1);
    });
  }
}

/**
 * Searches across document ProseMirror / TipTap AST structures within a workspace.
 * [Issue #45]: Safe regex construction with length limits and recursion depth guards.
 *
 * [ROMAN URDU]:
 * Workspace ke documents mein deep AST search execute karta hai. Node type filter
 * (jaise codeBlock, table) aur regex pattern matching ko combine karta hai.
 *
 * @param {string} workspaceId - Workspace ObjectId string
 * @param {Object} [criteria={}] - Search criteria
 * @param {string} [criteria.query] - Text search query (case-insensitive)
 * @param {string[]} [criteria.nodeTypes=[]] - Node types filter: ['heading', 'codeBlock', 'table', 'callout', 'taskList']
 * @param {string[]} [criteria.tags=[]] - Document tags filter
 * @param {number} [criteria.limit=20] - Maximum matching documents to return
 * @returns {Promise<Array<{ documentId: string, title: string, icon: string|null, folderId: string|null, tags: string[], matchCount: number, matches: Array, updatedAt: Date }>>}
 */
export async function searchContentAst(workspaceId, criteria = {}) {
  const { query, nodeTypes = [], tags = [], limit = 20 } = criteria;

  const mongoQuery = { workspaceId, isArchived: false };
  if (Array.isArray(tags) && tags.length > 0) {
    mongoQuery.tags = { $in: tags.map((t) => String(t).trim().toLowerCase()) };
  }

  const parsedLimit = Math.max(1, parseInt(limit, 10) || 20);

  const documents = await DocumentModel.find(mongoQuery)
    .select('id title icon folderId content updatedAt tags')
    .limit(parsedLimit * 2)
    .lean()
    .exec();

  const results = [];
  const sanitizedQuery = typeof query === 'string' ? query.trim().slice(0, 100) : '';
  const regex =
    sanitizedQuery
      ? new RegExp(escapeRegex(sanitizedQuery), 'i')
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
        tags: doc.tags || [],
        matchCount: matches.length,
        matches: matches.slice(0, 5),
        updatedAt: doc.updatedAt,
      });
    }

    if (results.length >= parsedLimit) break;
  }

  return results;
}
