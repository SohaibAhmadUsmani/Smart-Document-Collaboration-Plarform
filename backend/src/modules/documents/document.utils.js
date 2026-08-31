import crypto from 'crypto';

/**
 * Reserved JavaScript prototype pollution keys.
 * [ROMAN URDU]: Yeh reserved keys prototype pollution attacks se bachne ke liye block ki jati hain.
 */
const DANGEROUS_PROTOTYPE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Generates a cryptographically secure RFC 4122 v4 UUID with backward-compatible fallback.
 * [Issue #8]: Cryptographically secure UUID fallback using crypto.randomUUID() with fallback.
 *
 * [ROMAN URDU]: Yeh function cryptographically secure UUID v4 generate karta hai aur puranay Node versions ke liye fallback provide karta hai.
 *
 * @returns {string} Formatted UUID string (e.g., '123e4567-e89b-12d3-a456-426614174000')
 */
export function generateUuid() {
  if (typeof crypto?.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Cryptographically secure fallback using randomBytes
  const bytes = crypto.randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10_
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/**
 * Validates whether a URL or URI is safe against XSS, SVG injection, and malicious schemes.
 * [Issue #1 & #2]: Allows only http, https, mailto, tel, safe relative paths, and safe raster base64 images (png, jpeg, webp, gif).
 * Explicitly rejects: SVG vectors (image/svg+xml), javascript:, vbscript:, and raw HTML data URIs.
 *
 * [ROMAN URDU]: Yeh function check karta hai ke URL safe hai ya nahi. SVG data URIs, javascript:, aur vbscript: jaise XSS vectors ko block karta hai.
 *
 * @param {string} url - Target URL/URI to validate
 * @returns {boolean} True if safe, false otherwise
 */
export function isSafeUrl(url) {
  if (!url || typeof url !== 'string') return false;

  const trimmed = url.trim();
  if (!trimmed || trimmed.length > 2048) return false;

  // Check for dangerous control characters, null bytes, or protocol-relative XSS
  if (/[\x00-\x1F\x7F]/.test(trimmed) || /^\/\//.test(trimmed)) {
    return false;
  }

  // Reject URL-encoded javascript/vbscript schemes (e.g. %6a%61%76%61%73%63%72%69%70%74)
  let decodedLower;
  try {
    decodedLower = decodeURIComponent(trimmed).toLowerCase();
  } catch {
    decodedLower = trimmed.toLowerCase();
  }

  if (/^(javascript:|vbscript:)/i.test(decodedLower)) {
    return false;
  }

  // Disallow any SVG data URI or SVG tags (SVG XSS Vector)
  if (/data:\s*image\/svg\+xml/i.test(decodedLower) || /<svg/i.test(decodedLower)) {
    return false;
  }

  // Safe base64 raster image data URIs (PNG, JPEG, WEBP, GIF only)
  if (/^data:image\/(png|jpeg|jpg|webp|gif);base64,[a-z0-9+/=]+$/i.test(trimmed)) {
    return true;
  }

  // Disallow any other data: schemes (e.g., data:text/html, data:application/...)
  if (/^data:/i.test(trimmed)) {
    return false;
  }

  // Allow safe standard protocols: http, https, mailto, tel
  if (/^(https?:\/\/|mailto:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|tel:[+0-9\-() ]+)/i.test(trimmed)) {
    return true;
  }

  // Allow safe absolute relative URLs (e.g., /api/files/download/123, /uploads/img.png)
  if (/^\/[a-zA-Z0-9._~:/?#[\]@!$&'()*+,;=-]*$/.test(trimmed) && !trimmed.startsWith('//')) {
    return true;
  }

  return false;
}

/**
 * Escapes HTML control characters (&, <, >, ", ') to prevent Cross-Site Scripting (XSS).
 * [Issue #3]: HTML-escape <, >, ", ' in text nodes before Markdown/HTML exports.
 *
 * [ROMAN URDU]: Text ke andar HTML control characters ko escape karta hai taake rendering ke waqt XSS attacks se bacha ja sakay.
 *
 * @param {string} text - Raw text string
 * @returns {string} HTML-escaped string
 */
export function escapeHtml(text = '') {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Computes word count, character count, and estimated reading time from text.
 * [ROMAN URDU]: Plain text se word count, character count aur mutawaqqa parhne ka waqt (reading time) calculate karta hai.
 *
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
 * Ensures that every top-level node and block in the TipTap / ProseMirror AST contains a unique blockId.
 * Strips prototype pollution keys during cloning.
 *
 * [ROMAN URDU]: Yeh function ensure karta hai ke AST ke har node ke paas unique blockId ho, jo comment anchoring aur collaborative sync ke liye zaroori hai.
 *
 * @param {Object} documentAst - Document JSON AST
 * @returns {Object} AST with guaranteed unique blockIds
 */
export function ensureBlockIdsInAst(documentAst) {
  if (!documentAst || typeof documentAst !== 'object') {
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { blockId: `block_${generateUuid()}` },
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

    // Filter dangerous prototype pollution keys
    const rawAttrs = node.attrs || {};
    const cleanAttrs = {};
    for (const key of Object.keys(rawAttrs)) {
      if (!DANGEROUS_PROTOTYPE_KEYS.has(key) && Object.prototype.hasOwnProperty.call(rawAttrs, key)) {
        cleanAttrs[key] = rawAttrs[key];
      }
    }

    if (!cleanAttrs.blockId) {
      cleanAttrs.blockId = `block_${generateUuid()}`;
    }

    return {
      ...node,
      attrs: cleanAttrs,
    };
  });

  return {
    ...documentAst,
    content: processedContent,
  };
}

/**
 * Validates whether a specific blockId exists in a document AST.
 * [ROMAN URDU]: Check karta hai ke specific blockId AST content ke andar mojood hai ya nahi.
 *
 * @param {Object} documentAst
 * @param {string} blockId
 * @returns {boolean}
 */
export function validateBlockIdExists(documentAst, blockId) {
  if (!documentAst || !Array.isArray(documentAst.content) || !blockId) return false;

  function findId(nodes) {
    for (const node of nodes) {
      if (node?.attrs?.blockId === blockId) return true;
      if (Array.isArray(node?.content) && findId(node.content)) return true;
    }
    return false;
  }

  return findId(documentAst.content);
}

/**
 * Extracts Table of Contents outline (H1-H6) from document AST.
 * [ROMAN URDU]: Document AST se heading outline (H1 se H6 tak) extract karta hai navigation aur ToC ke liye.
 *
 * @param {Object} documentAst
 * @returns {Array<{ level: number, text: string, blockId: string|null }>}
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
 * [Issue #41]: Preserves newlines (\n) within codeBlock nodes and structural line-breaks.
 *
 * [ROMAN URDU]: AST node se plain text extract karta hai aur code blocks mein newlines (\n) ko qaim rakhta hai.
 *
 * @param {Object} node - AST Node
 * @returns {string} Plain text representation
 */
export function extractPlainTextFromAst(node) {
  if (!node || typeof node !== 'object') return '';

  if (node.type === 'text' && typeof node.text === 'string') {
    return node.text;
  }

  if (node.type === 'hardBreak') {
    return '\n';
  }

  if (node.type === 'codeBlock') {
    if (Array.isArray(node.content)) {
      const codeText = node.content.map(extractPlainTextFromAst).join('');
      return codeText.endsWith('\n') ? codeText : `${codeText}\n`;
    }
    const rawText = typeof node.text === 'string' ? node.text : '';
    return rawText.endsWith('\n') ? rawText : `${rawText}\n`;
  }

  if (Array.isArray(node.content)) {
    const isBlockContainer = ['paragraph', 'heading', 'blockquote', 'callout', 'listItem', 'taskItem', 'tableRow'].includes(node.type);
    const innerText = node.content.map(extractPlainTextFromAst).join('');
    return isBlockContainer ? `${innerText}\n` : innerText;
  }

  return '';
}

/**
 * Converts a structured document AST JSON tree into clean, sanitized Markdown format.
 * [Issue #3]: HTML-escapes raw text nodes to prevent HTML injection in downstream Markdown renderers.
 *
 * [ROMAN URDU]: AST tree ko clean Markdown format mein convert karta hai aur dangerous HTML characters ko escape karta hai.
 *
 * @param {Object} documentAst - TipTap / ProseMirror AST representation.
 * @param {string} [documentTitle] - Optional title to prepend as H1.
 * @returns {string} Markdown text.
 */
export function astToMarkdown(documentAst, documentTitle = '') {
  const lines = [];

  if (documentTitle) {
    lines.push(`# ${escapeHtml(documentTitle)}\n`);
  }

  if (!documentAst || !Array.isArray(documentAst.content)) {
    return lines.join('\n');
  }

  function renderNode(node) {
    if (!node || typeof node !== 'object') return '';

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
        const type = String(node.attrs?.type || 'info').toLowerCase();
        const safeType = /^[a-z0-9_-]+$/.test(type) ? type : 'info';
        const text = renderChildren(node);
        return `\n> [!${safeType.toUpperCase()}]\n> ${text.trim().replace(/\n/g, '\n> ')}\n`;
      }
      case 'codeBlock': {
        const lang = String(node.attrs?.language || '').replace(/[^a-zA-Z0-9_-]/g, '');
        // In code blocks, extract code text preserving newlines
        const code = Array.isArray(node.content)
          ? node.content.map((c) => (c.type === 'text' ? c.text : extractPlainTextFromAst(c))).join('')
          : (node.text || '');
        return `\n\`\`\`${lang}\n${code.replace(/\n+$/, '')}\n\`\`\`\n`;
      }
      case 'bulletList': {
        return `\n${(node.content || []).map((item) => `- ${renderChildren(item).trim()}`).join('\n')}\n`;
      }
      case 'orderedList': {
        return `\n${(node.content || []).map((item, i) => `${i + 1}. ${renderChildren(item).trim()}`).join('\n')}\n`;
      }
      case 'taskList': {
        return `\n${(node.content || []).map((item) => `- [${item.attrs?.checked ? 'x' : ' '}] ${renderChildren(item).trim()}`).join('\n')}\n`;
      }
      case 'listItem':
      case 'taskItem': {
        return renderChildren(node);
      }
      case 'horizontalRule': {
        return '\n---\n';
      }
      case 'fileAttachment': {
        const filename = escapeHtml(node.attrs?.filename || 'Attachment');
        const rawUrl = node.attrs?.url || '#';
        const url = isSafeUrl(rawUrl) ? rawUrl : '#';
        return `\n📎 [${filename}](${url})\n`;
      }
      case 'image': {
        const alt = escapeHtml(node.attrs?.alt || 'image');
        const rawSrc = node.attrs?.src || '';
        const src = isSafeUrl(rawSrc) ? rawSrc : '';
        return src ? `\n![${alt}](${src})\n` : '';
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
        let text = escapeHtml(node.text || '');
        if (node.marks && Array.isArray(node.marks)) {
          for (const mark of node.marks) {
            if (!mark || typeof mark !== 'object') continue;
            if (mark.type === 'bold') text = `**${text}**`;
            if (mark.type === 'italic') text = `*${text}*`;
            if (mark.type === 'strike') text = `~~${text}~~`;
            if (mark.type === 'code') text = `\`${text}\``;
            if (mark.type === 'link' && mark.attrs?.href) {
              const href = mark.attrs.href;
              if (isSafeUrl(href)) {
                text = `[${text}](${href})`;
              }
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
 * [Issue #1 & #2]: Strips SVG XSS vectors, javascript:/vbscript: URIs, unsafe data URIs, and prototype pollution keys.
 * [Issue #24]: Guards against call stack recursion bombs via max depth check (default 30).
 *
 * [ROMAN URDU]: Yeh function AST ko deeply scan aur sanitize karta hai taake malicious scripts, unsafe links, SVG injection, aur prototype pollution ko strip kiya ja sake.
 *
 * @param {Object} node - AST node to sanitize
 * @param {number} [depth=1] - Current traversal depth
 * @param {number} [maxDepth=30] - Maximum allowed AST recursion depth
 * @returns {Object|null} Sanitized AST node or null if invalid
 */
export function sanitizeDocumentAst(node, depth = 1, maxDepth = 30) {
  if (!node || typeof node !== 'object' || depth > maxDepth) {
    return null;
  }

  // Filter out prototype pollution keys from the node itself
  const sanitized = {};
  for (const key of Object.keys(node)) {
    if (!DANGEROUS_PROTOTYPE_KEYS.has(key) && Object.prototype.hasOwnProperty.call(node, key)) {
      sanitized[key] = node[key];
    }
  }

  // Sanitize node attrs
  if (sanitized.attrs && typeof sanitized.attrs === 'object') {
    const cleanAttrs = {};
    for (const key of Object.keys(sanitized.attrs)) {
      if (!DANGEROUS_PROTOTYPE_KEYS.has(key) && Object.prototype.hasOwnProperty.call(sanitized.attrs, key)) {
        cleanAttrs[key] = sanitized.attrs[key];
      }
    }

    // Validate image src
    if (sanitized.type === 'image' && cleanAttrs.src) {
      cleanAttrs.src = isSafeUrl(cleanAttrs.src) ? cleanAttrs.src : '';
    }

    // Validate fileAttachment url
    if (sanitized.type === 'fileAttachment' && cleanAttrs.url) {
      cleanAttrs.url = isSafeUrl(cleanAttrs.url) ? cleanAttrs.url : '#';
    }

    sanitized.attrs = cleanAttrs;
  }

  // Sanitize marks (e.g., link hrefs)
  if (Array.isArray(sanitized.marks)) {
    sanitized.marks = sanitized.marks
      .map((mark) => {
        if (!mark || typeof mark !== 'object') return null;

        const cleanMark = {};
        for (const key of Object.keys(mark)) {
          if (!DANGEROUS_PROTOTYPE_KEYS.has(key) && Object.prototype.hasOwnProperty.call(mark, key)) {
            cleanMark[key] = mark[key];
          }
        }

        if (cleanMark.type === 'link') {
          const rawHref = cleanMark.attrs?.href;
          if (!isSafeUrl(rawHref)) {
            return null; // Strip unsafe link mark
          }
        }

        return cleanMark;
      })
      .filter(Boolean);
  }

  // Recursively sanitize child content nodes
  if (Array.isArray(sanitized.content)) {
    sanitized.content = sanitized.content
      .map((child) => sanitizeDocumentAst(child, depth + 1, maxDepth))
      .filter(Boolean);
  }

  return sanitized;
}
