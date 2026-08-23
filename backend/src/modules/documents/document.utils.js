/**
 * Document Utilities: Text extraction, stats computation, and Markdown exporter.
 */

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
      case 'listItem': {
        return renderChildren(node);
      }
      case 'horizontalRule': {
        return '\n---\n';
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
