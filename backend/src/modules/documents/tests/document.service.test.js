import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDocumentStats,
  ensureBlockIdsInAst,
  sanitizeDocumentAst,
  astToMarkdown,
} from '../document.utils.js';
import { getTemplateById, DOCUMENT_TEMPLATES } from '../documentTemplates.js';

test('calculateDocumentStats correctly computes words, characters, and reading time', () => {
  const sampleText = 'The quick brown fox jumps over the lazy dog. A second sentence for word counting.';
  const stats = calculateDocumentStats(sampleText);

  assert.equal(stats.words, 15);
  assert.equal(stats.characters, sampleText.length);
  assert.equal(stats.paragraphs, 1);
  assert.equal(stats.readingTimeMinutes, 1);
});

test('calculateDocumentStats handles empty or null strings gracefully', () => {
  const statsEmpty = calculateDocumentStats('');
  assert.equal(statsEmpty.words, 0);
  assert.equal(statsEmpty.characters, 0);

  const statsNull = calculateDocumentStats(null);
  assert.equal(statsNull.words, 0);
});

test('ensureBlockIdsInAst generates unique blockIds for AST nodes missing them', () => {
  const astWithoutIds = {
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'World' }] },
    ],
  };

  const processed = ensureBlockIdsInAst(astWithoutIds);
  assert.ok(processed.content[0].attrs.blockId.startsWith('block_'));
  assert.ok(processed.content[1].attrs.blockId.startsWith('block_'));
  assert.notEqual(processed.content[0].attrs.blockId, processed.content[1].attrs.blockId);
});

test('sanitizeDocumentAst strips malicious javascript: and vbscript: links from AST', () => {
  const maliciousAst = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Click here for free prize',
            marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }],
          },
          {
            type: 'text',
            text: 'Legitimate Link',
            marks: [{ type: 'link', attrs: { href: 'https://example.com' } }],
          },
        ],
      },
      {
        type: 'image',
        attrs: { src: 'javascript:evil()', alt: 'Hacked' },
      },
    ],
  };

  const cleanAst = sanitizeDocumentAst(maliciousAst);
  
  // The first text node should have had its javascript: link mark stripped
  assert.equal(cleanAst.content[0].content[0].marks.length, 0);
  
  // The second text node's legitimate https link should be preserved
  assert.equal(cleanAst.content[0].content[1].marks.length, 1);
  assert.equal(cleanAst.content[0].content[1].marks[0].attrs.href, 'https://example.com');
  
  // The malicious image source should be blanked out
  assert.equal(cleanAst.content[1].attrs.src, '');
});

test('astToMarkdown converts AST headings, lists, tables, and callouts to valid markdown', () => {
  const ast = {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'Main Heading' }],
      },
      {
        type: 'callout',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Important notice' }] }],
      },
      {
        type: 'bulletList',
        content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item 1' }] }] },
        ],
      },
    ],
  };

  const md = astToMarkdown(ast, 'Main Heading');
  assert.ok(md.includes('# Main Heading'));
  assert.ok(md.includes('Important notice'));
  assert.ok(md.includes('- Item 1'));
});


test('getTemplateById returns defined starter templates for PRD and Meeting Notes', () => {
  const meetingTemplate = getTemplateById('meeting_notes');
  assert.ok(meetingTemplate);
  assert.equal(meetingTemplate.title, 'Weekly Sync / Meeting Notes');
  assert.ok(Array.isArray(meetingTemplate.content.content));

  const prdTemplate = getTemplateById('prd');
  assert.ok(prdTemplate);
  assert.equal(prdTemplate.id, 'prd');

  const invalid = getTemplateById('non_existent');
  assert.equal(invalid, null);
});
