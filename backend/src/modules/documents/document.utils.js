import crypto from 'crypto';

/**
 * Computes word count, character count, and estimated reading time from text.
 * @param {string} text - Raw plain text of the document.
 * @returns {{ words: number, characters: number, charactersNoSpaces: number, paragraphs: number, readingTimeMinutes: number }}
 */
export function calculateDocumentStats(text = '') {
  if (!text || typeof text !== 'string') {
    return {
      words: 0,
      characters: 0,
      charactersNoSpaces: 0,
      paragraphs: 0,
      readingTimeMinutes: 0,
    };
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return {
      words: 0,
      characters: 0,
      charactersNoSpaces: 0,
      paragraphs: 0,
      readingTimeMinutes: 0,
    };
  }

  const words = trimmed.split(/\s+/).filter(Boolean).length;
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;
  const paragraphs = text.split(/\n+/).filter((p) => p.trim().length > 0).length;
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));

  return {
    words,
    characters,
    charactersNoSpaces,
    paragraphs,
    readingTimeMinutes,
  };
}

/**
 * Ensures that every top-level node in the TipTap / ProseMirror AST contains a unique blockId.
 * This is crucial for comment anchoring, real-time presence, and block-level diffing.
 *
 * @param {Object} documentAst - Document JSON AST
 * @returns {Object} AST with guaranteed blockIds
 */
export function ensureBlockIdsInAst(documentAst) {
  if (!documentAst || typeof documentAst !== 'object') {
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { blockId: `block_${crypto.randomUUID()}` },
          content: [],
        },
      ],
    };
  }

  if (!Array.isArray(documentAst.content)) {
    return {
      type: 'doc',
      content: [],
    };
  }

  const processedContent = documentAst.content.map((node) => {
    if (!node || typeof node !== 'object') return node;
    const attrs = { ...(node.attrs || {}) };
    if (!attrs.blockId) {
      attrs.blockId = `block_${crypto.randomUUID()}`;
    }
    return {
      ...node,
      attrs,
    };
  });

  return {
    ...documentAst,
    content: processedContent,
  };
}

/**
 * Validates whether a specific blockId exists in a document AST.
 *
 * @param {Object} documentAst
 * @param {string} blockId
 * @returns {boolean}
 */
export function validateBlockIdExists(documentAst, blockId) {
  if (!documentAst || !Array.isArray(documentAst.content) || !blockId) return false;

  return documentAst.content.some((node) => node?.attrs?.blockId === blockId);
}

/**
 * Extracts Table of Contents outline (H1-H6) from document AST.
 *
 * @param {Object} documentAst
 * @returns {Array<{ level: number, text: string, blockId: string }>}
 */
export function extractHeadingsOutline(documentAst) {
  if (!documentAst || !Array.isArray(documentAst.content)) return [];

  const outline = [];

  for (const node of documentAst.content) {
    if (node && node.type === 'heading') {
      const level = Math.min(6, Math.max(1, node.attrs?.level || 1));
      const text = extractPlainTextFromAst(node).trim();
      const blockId = node.attrs?.blockId || null;
      outline.push({ level, text, blockId });
    }
  }

  return outline;
}

/**
 * Recursively extracts plain text from a TipTap/ProseMirror AST node.
 * @param {Object} node - AST Node
 * @returns {string}
 */
export function extractPlainTextFromAst(node) {
  if (!node) return '';

  if (node.type === 'text' && node.text) {
    return node.text;
  }

  if (Array.isArray(node.content)) {
    return node.content.map(extractPlainTextFromAst).join('');
  }

  return '';
}

/**
 * Converts a structured document AST JSON tree into clean Markdown format.
 * @param {Object} documentAst - TipTap / ProseMirror AST representation.
 * @param {string} [documentTitle] - Optional title to prepend as H1.
 * @returns {string} Markdown text.
 */
export function astToMarkdown(documentAst, documentTitle = '') {
  const lines = [];

  if (documentTitle) {
    lines.push(`# ${documentTitle}\n`);
  }

  if (!documentAst || !Array.isArray(documentAst.content)) {
    return lines.join('\n');
  }

  function renderNode(node) {
    if (!node) return '';

    switch (node.type) {
      case 'heading': {
        const level = Math.min(6, Math.max(1, node.attrs?.level || 1));
        const prefix = '#'.repeat(level);
        const text = renderChildren(node);
        return `\n${prefix} ${text}\n`;
      }
      case 'paragraph': {
        const text = renderChildren(node);
        return text ? `${text}\n` : '\n';
      }
      case 'blockquote': {
        const text = renderChildren(node);
        return `\n> ${text.trim().replace(/\n/g, '\n> ')}\n`;
      }
      case 'callout': {
        const type = node.attrs?.type || 'info';
        const text = renderChildren(node);
        return `\n> [!${type.toUpperCase()}]\n> ${text.trim().replace(/\n/g, '\n> ')}\n`;
      }
      case 'codeBlock': {
        const lang = node.attrs?.language || '';
        const code = renderChildren(node);
        return `\n\`\`\`${lang}\n${code}\n\`\`\`\n`;
      }
      case 'bulletList': {
        return `\n${node.content?.map((item) => `- ${renderChildren(item).trim()}`).join('\n')}\n`;
      }
      case 'orderedList': {
        return `\n${node.content?.map((item, i) => `${i + 1}. ${renderChildren(item).trim()}`).join('\n')}\n`;
      }
      case 'taskList': {
        return `\n${node.content?.map((item) => `- [${item.attrs?.checked ? 'x' : ' '}] ${renderChildren(item).trim()}`).join('\n')}\n`;
      }
      case 'listItem':
      case 'taskItem': {
        return renderChildren(node);
      }
      case 'horizontalRule': {
        return '\n---\n';
      }
      case 'fileAttachment': {
        const filename = node.attrs?.filename || 'Attachment';
        const url = node.attrs?.url || '#';
        return `\n📎 [${filename}](${url})\n`;
      }
      case 'table': {
        if (!Array.isArray(node.content) || node.content.length === 0) return '';
        const rows = node.content.map((row) =>
          (row.content || []).map((cell) => renderChildren(cell).trim())
        );
        if (rows.length === 0) return '';

        const header = `| ${rows[0].join(' | ')} |`;
        const separator = `| ${rows[0].map(() => '---').join(' | ')} |`;
        const body = rows
          .slice(1)
          .map((row) => `| ${row.join(' | ')} |`)
          .join('\n');

        return `\n${header}\n${separator}${body ? '\n' + body : ''}\n`;
      }
      case 'text': {
        let text = node.text || '';
        if (node.marks && Array.isArray(node.marks)) {
          for (const mark of node.marks) {
            if (mark.type === 'bold') text = `**${text}**`;
            if (mark.type === 'italic') text = `*${text}*`;
            if (mark.type === 'strike') text = `~~${text}~~`;
            if (mark.type === 'code') text = `\`${text}\``;
            if (mark.type === 'link' && mark.attrs?.href) {
              text = `[${text}](${mark.attrs.href})`;
            }
          }
        }
        return text;
      }
      default: {
        return renderChildren(node);
      }
    }
  }

  function renderChildren(node) {
    if (!node || !Array.isArray(node.content)) return '';
    return node.content.map(renderNode).join('');
  }

  for (const block of documentAst.content) {
    const rendered = renderNode(block);
    if (rendered) {
      lines.push(rendered);
    }
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n');
}

/**
 * Sanitizes a ProseMirror / TipTap Document AST recursively.
 * Strips dangerous URI schemes (javascript:, vbscript:, data:text/html) from link marks
 * and ensures safe attribute values on all nodes.
 *
 * @param {Object} node - AST node to sanitize
 * @returns {Object} Sanitized AST node
 */
export function sanitizeDocumentAst(node) {
  if (!node || typeof node !== 'object') return node;

  const sanitized = { ...node };

  // Sanitize marks (e.g. links)
  if (Array.isArray(sanitized.marks)) {
    sanitized.marks = sanitized.marks
      .map((mark) => {
        if (!mark || typeof mark !== 'object') return null;
        if (mark.type === 'link') {
          const href = String(mark.attrs?.href || '').trim();
          // Filter out dangerous URI schemes
          if (/^(javascript:|vbscript:|data:(?!image\/))/i.test(href)) {
            return null; // Strip malicious link mark
          }
        }
        return mark;
      })
      .filter(Boolean);
  }

  // Sanitize node-specific attributes
  if (sanitized.type === 'image' && sanitized.attrs?.src) {
    const src = String(sanitized.attrs.src).trim();
    if (/^(javascript:|vbscript:)/i.test(src)) {
      sanitized.attrs = { ...sanitized.attrs, src: '' };
    }
  }

  // Recursively sanitize children
  if (Array.isArray(sanitized.content)) {
    sanitized.content = sanitized.content.map(sanitizeDocumentAst).filter(Boolean);
  }

  return sanitized;
}

