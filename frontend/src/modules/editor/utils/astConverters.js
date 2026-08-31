/**
 * @file astConverters.js
 * @description Frontend AST plain text and Markdown transformation engine for DocSync Pro.
 * Converts ProseMirror / TipTap JSON document trees into clean markdown text or plain strings.
 * @module frontend/src/modules/editor/utils/astConverters
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh utility file TipTap / ProseMirror document AST ko plain text aur standard Markdown
 * format mein convert karne ke single-responsibility functions faraham karti hai.
 * Unused imports ko khatam karke backend ke converter ke sath align kiya gaya hai.
 */

/**
 * Recursively extracts plain text from a TipTap / ProseMirror AST node or document tree.
 *
 * [ROMAN URDU]:
 * AST node ko recursively traverse karke sirf textual data return karta hai.
 *
 * @param {Object} node - AST Node or root document
 * @returns {string} Extracted plain text string
 */
export function extractPlainTextFromAst(node) {
  if (!node) return '';

  if (node.type === 'text' && node.text) {
    return node.text;
  }

  if (Array.isArray(node.content)) {
    return node.content.map(extractPlainTextFromAst).join('\n');
  }

  return '';
}

/**
 * Converts a structured document AST JSON tree into clean Markdown text.
 * Handles headings, paragraphs, blockquotes, callouts, code blocks, lists,
 * tables, horizontal rules, attachments, and inline mark styling (bold, italic, strike, code, link).
 *
 * [ROMAN URDU]:
 * TipTap AST JSON tree ko clean Markdown format mein convert karta hai. Table rows,
 * callout alerts, aur code blocks ko proper markdown syntax mein transform karta hai.
 *
 * @param {Object} documentAst - TipTap / ProseMirror AST JSON representation
 * @param {string} [documentTitle=''] - Optional title to prepend as H1 heading
 * @returns {string} Formatted Markdown text
 */
export function astToMarkdown(documentAst, documentTitle = '') {
  const lines = [];

  if (documentTitle) {
    lines.push(`# ${documentTitle}\n`);
  }

  if (!documentAst || !Array.isArray(documentAst.content)) {
    return lines.join('\n');
  }

  function renderChildren(node) {
    if (!node || !Array.isArray(node.content)) return '';
    return node.content.map(renderNode).join('');
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

  for (const block of documentAst.content) {
    const rendered = renderNode(block);
    if (rendered) {
      lines.push(rendered);
    }
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n');
}
