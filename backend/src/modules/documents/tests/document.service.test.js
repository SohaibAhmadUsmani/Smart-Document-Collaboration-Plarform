/**
 * @file document.service.test.js
 * @description Comprehensive unit tests for Document module utilities, AST sanitization,
 * OCC validation, security guards, SVG XSS protection, prototype pollution prevention,
 * UUID fallback, Markdown exporting, reading statistics, starter template hydration,
 * and Express validation middlewares.
 * @module backend/src/modules/documents/tests/document.service.test
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh test file Document module ke tamam critical security fixes, AST sanitization,
 * OCC optimistic concurrency logic, prototype pollution protection, reading statistics,
 * aur dynamic starter templates ke unit tests execute karti hai.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDocumentStats,
  ensureBlockIdsInAst,
  sanitizeDocumentAst,
  astToMarkdown,
  isSafeUrl,
  escapeHtml,
  generateUuid,
  extractPlainTextFromAst,
  validateBlockIdExists,
  extractHeadingsOutline,
} from '../document.utils.js';
import { getTemplateById, DOCUMENT_TEMPLATES } from '../documentTemplates.js';
import {
  checkAstDepth,
  ALLOWED_ATTACHMENT_MIME_TYPES,
  validateDocumentId,
  validateCreateDocument,
  validateAutosave,
  validateAttachment,
} from '../document.validation.js';
import { escapeRegex } from '../documentAstSearch.service.js';

// ============================================================================
// 1. URL & Protocol Security Tests (Issue #1, #2, #6)
// ============================================================================

test('[Issue #1 & #2] isSafeUrl permits safe protocols and safe raster base64 images', () => {
  const safeUrls = [
    'https://example.com/docs/intro',
    'http://localhost:3000/api/files',
    'mailto:support@docsync.pro',
    'tel:+1-800-555-0199',
    '/api/files/download/654321098765432109876543',
    '/uploads/avatar.png',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
    'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==',
    'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  ];

  for (const url of safeUrls) {
    assert.equal(isSafeUrl(url), true, `Expected URL to be safe: ${url}`);
  }
});

test('[Issue #1 & #2] isSafeUrl blocks SVG XSS vectors, javascript schemes, and unsafe data URIs', () => {
  const unsafeUrls = [
    'javascript:alert(document.domain)',
    'javascript://%0aalert(1)',
    '%6a%61%76%61%73%63%72%69%70%74:alert(1)',
    'vbscript:msgbox(1)',
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxzY3JpcHQ+YWxlcnQoMSk8L3NjcmlwdD48L3N2Zz4=',
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    'data:text/html,<script>alert(1)</script>',
    'data:application/javascript,alert(1)',
    '//evil.com/phishing',
    'https://evil.com/\x00test',
    '',
    null,
    undefined,
    12345,
  ];

  for (const url of unsafeUrls) {
    assert.equal(isSafeUrl(url), false, `Expected URL to be rejected as unsafe: ${url}`);
  }
});

// ============================================================================
// 2. Prototype Pollution & AST Sanitization Tests (Issue #1, #2, #24)
// ============================================================================

test('sanitizeDocumentAst strips reserved prototype pollution keys (__proto__, constructor, prototype)', () => {
  const payload = JSON.parse(`{
    "type": "doc",
    "__proto__": { "polluted": "yes" },
    "constructor": { "prototype": { "isAdmin": true } },
    "content": [
      {
        "type": "paragraph",
        "__proto__": { "injected": "true" },
        "attrs": {
          "blockId": "block_test1",
          "__proto__": { "vuln": true },
          "constructor": "malicious"
        },
        "content": [
          {
            "type": "text",
            "text": "Safe text content"
          }
        ]
      }
    ]
  }`);

  const sanitized = sanitizeDocumentAst(payload);

  assert.equal(Object.prototype.hasOwnProperty.call(sanitized, '__proto__'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(sanitized, 'constructor'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(sanitized, 'prototype'), false);
  assert.equal({}.polluted, undefined);
  assert.equal({}.isAdmin, undefined);
  assert.equal({}.injected, undefined);
  assert.equal({}.vuln, undefined);
  assert.equal(Object.prototype.hasOwnProperty.call(sanitized.content[0].attrs, 'constructor'), false);
  assert.notEqual(sanitized.content[0].attrs.constructor, 'malicious');
  assert.equal(sanitized.content[0].attrs.blockId, 'block_test1');
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
      {
        type: 'fileAttachment',
        attrs: { url: 'data:text/html,<script>alert(1)</script>', filename: 'test.html' },
      },
    ],
  };

  const cleanAst = sanitizeDocumentAst(maliciousAst);

  // Malicious javascript: link mark must be removed
  assert.equal(cleanAst.content[0].content[0].marks.length, 0);

  // Legitimate https link must be preserved
  assert.equal(cleanAst.content[0].content[1].marks.length, 1);
  assert.equal(cleanAst.content[0].content[1].marks[0].attrs.href, 'https://example.com');

  // Malicious image source must be blanked out
  assert.equal(cleanAst.content[1].attrs.src, '');

  // Malicious file attachment URL must fallback to '#'
  assert.equal(cleanAst.content[2].attrs.url, '#');
});

// ============================================================================
// 3. HTML Escaping & Markdown Export Tests (Issue #3, #46)
// ============================================================================

test('[Issue #3] escapeHtml correctly escapes HTML control characters', () => {
  const raw = '<script>alert("XSS & \'injection\'")</script>';
  const escaped = escapeHtml(raw);

  assert.equal(escaped, '&lt;script&gt;alert(&quot;XSS &amp; &#39;injection&#39;&quot;)&lt;/script&gt;');
  assert.equal(escapeHtml(''), '');
  assert.equal(escapeHtml(null), '');
});

test('[Issue #3 & #41] astToMarkdown converts AST to sanitized markdown while escaping HTML in text', () => {
  const ast = {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'Main <Heading> & "Title"' }],
      },
      {
        type: 'callout',
        attrs: { type: 'warning' },
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Critical <alert>' }] }],
      },
      {
        type: 'codeBlock',
        attrs: { language: 'javascript' },
        content: [{ type: 'text', text: 'const a = 10;\nconst b = 20;\nconsole.log(a + b);' }],
      },
      {
        type: 'bulletList',
        content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Bullet Item 1' }] }] },
        ],
      },
      {
        type: 'table',
        content: [
          {
            type: 'tableRow',
            content: [
              { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Col 1' }] }] },
              { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Col 2' }] }] },
            ],
          },
          {
            type: 'tableRow',
            content: [
              { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Val 1' }] }] },
              { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Val 2' }] }] },
            ],
          },
        ],
      },
    ],
  };

  const md = astToMarkdown(ast, 'Doc <Title>');

  assert.ok(md.includes('# Doc &lt;Title&gt;'));
  assert.ok(md.includes('# Main &lt;Heading&gt; &amp; &quot;Title&quot;'));
  assert.ok(md.includes('> [!WARNING]'));
  assert.ok(md.includes('Critical &lt;alert&gt;'));
  assert.ok(md.includes('```javascript\nconst a = 10;\nconst b = 20;\nconsole.log(a + b);\n```'));
  assert.ok(md.includes('- Bullet Item 1'));
  assert.ok(md.includes('| Col 1 | Col 2 |'));
  assert.ok(md.includes('| --- | --- |'));
  assert.ok(md.includes('| Val 1 | Val 2 |'));
});

// ============================================================================
// 4. UUID Fallback & Block ID Generation Tests (Issue #8, #43)
// ============================================================================

test('[Issue #8] generateUuid produces valid RFC 4122 v4 UUID strings', () => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const id1 = generateUuid();
  const id2 = generateUuid();

  assert.ok(uuidRegex.test(id1), `Generated UUID failed regex: ${id1}`);
  assert.ok(uuidRegex.test(id2), `Generated UUID failed regex: ${id2}`);
  assert.notEqual(id1, id2, 'Consecutive UUIDs should be strictly unique');
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

test('[Issue #43] getTemplateById regenerates dynamic unique blockIds on each hydration', () => {
  const instance1 = getTemplateById('meeting_notes');
  const instance2 = getTemplateById('meeting_notes');

  assert.ok(instance1);
  assert.ok(instance2);
  assert.equal(instance1.title, 'Weekly Sync / Meeting Notes');

  // Verify that top-level blockIds are dynamic and non-identical between invocations
  const blockId1 = instance1.content.content[0].attrs.blockId;
  const blockId2 = instance2.content.content[0].attrs.blockId;

  assert.ok(blockId1.startsWith('block_'), `Expected blockId to start with 'block_', got: ${blockId1}`);
  assert.ok(blockId2.startsWith('block_'), `Expected blockId to start with 'block_', got: ${blockId2}`);
  assert.notEqual(blockId1, blockId2, 'Each template hydration must generate fresh unique blockIds');

  const prdTemplate = getTemplateById('prd');
  assert.ok(prdTemplate);
  assert.equal(prdTemplate.id, 'prd');

  const rfcTemplate = getTemplateById('technical_rfc');
  assert.ok(rfcTemplate);
  assert.equal(rfcTemplate.id, 'technical_rfc');

  const invalid = getTemplateById('non_existent');
  assert.equal(invalid, null);
});

// ============================================================================
// 5. Code Block Plain Text Extraction Tests (Issue #41)
// ============================================================================

test('[Issue #41] extractPlainTextFromAst preserves newlines within codeBlock nodes', () => {
  const astWithCode = {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'Code Sample' }],
      },
      {
        type: 'codeBlock',
        attrs: { language: 'javascript' },
        content: [{ type: 'text', text: 'function calculate() {\n  const x = 42;\n  return x * 2;\n}' }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'End of sample.' }],
      },
    ],
  };

  const plainText = extractPlainTextFromAst(astWithCode);

  assert.ok(plainText.includes('function calculate() {\n  const x = 42;\n  return x * 2;\n}'));
  assert.ok(plainText.includes('Code Sample'));
  assert.ok(plainText.includes('End of sample.'));
});

// ============================================================================
// 6. AST Depth Validation & ReDoS Guard Tests (Issue #24, #45, #30)
// ============================================================================

test('[Issue #24] checkAstDepth enforces max 30 levels nesting threshold to prevent DoS bombs', () => {
  // Safe shallow tree (depth = 3)
  const shallowTree = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Normal depth' }],
      },
    ],
  };
  assert.equal(checkAstDepth(shallowTree, 1, 30), true);

  // Malicious deeply nested recursion bomb tree (depth = 35)
  let deepTree = { type: 'text', text: 'Deep payload' };
  for (let i = 0; i < 35; i++) {
    deepTree = { type: 'branch', content: [deepTree] };
  }
  assert.equal(checkAstDepth(deepTree, 1, 30), false);
});

test('[Issue #45] escapeRegex properly escapes special characters to prevent ReDoS', () => {
  const dangerousSearch = '.*+?^${}()|[]\\test(a+)+';
  const escaped = escapeRegex(dangerousSearch);

  assert.equal(escaped, '\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\test\\(a\\+\\)\\+');
  assert.doesNotThrow(() => new RegExp(escaped, 'i'));
  assert.equal(escapeRegex(''), '');
  assert.equal(escapeRegex(null), '');
});

test('[Issue #30] ALLOWED_ATTACHMENT_MIME_TYPES whitelist permits safe files and rejects SVG/HTML/Executables', () => {
  // Permitted types
  assert.ok(ALLOWED_ATTACHMENT_MIME_TYPES.has('image/png'));
  assert.ok(ALLOWED_ATTACHMENT_MIME_TYPES.has('image/jpeg'));
  assert.ok(ALLOWED_ATTACHMENT_MIME_TYPES.has('application/pdf'));
  assert.ok(ALLOWED_ATTACHMENT_MIME_TYPES.has('text/markdown'));
  assert.ok(ALLOWED_ATTACHMENT_MIME_TYPES.has('application/json'));
  assert.ok(ALLOWED_ATTACHMENT_MIME_TYPES.has('application/zip'));

  // Disallowed dangerous types
  assert.equal(ALLOWED_ATTACHMENT_MIME_TYPES.has('image/svg+xml'), false);
  assert.equal(ALLOWED_ATTACHMENT_MIME_TYPES.has('text/html'), false);
  assert.equal(ALLOWED_ATTACHMENT_MIME_TYPES.has('application/javascript'), false);
  assert.equal(ALLOWED_ATTACHMENT_MIME_TYPES.has('application/x-sh'), false);
  assert.equal(ALLOWED_ATTACHMENT_MIME_TYPES.has('application/x-msdownload'), false);
});

// ============================================================================
// 7. Statistics & Outline Computation Tests
// ============================================================================

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

test('validateBlockIdExists and extractHeadingsOutline work accurately', () => {
  const ast = {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1, blockId: 'h1_block' },
        content: [{ type: 'text', text: 'Architecture Overview' }],
      },
      {
        type: 'heading',
        attrs: { level: 2, blockId: 'h2_block' },
        content: [{ type: 'text', text: 'Database Design' }],
      },
      {
        type: 'paragraph',
        attrs: { blockId: 'p_block' },
        content: [{ type: 'text', text: 'Details here.' }],
      },
    ],
  };

  assert.equal(validateBlockIdExists(ast, 'h1_block'), true);
  assert.equal(validateBlockIdExists(ast, 'non_existent'), false);

  const outline = extractHeadingsOutline(ast);
  assert.equal(outline.length, 2);
  assert.equal(outline[0].level, 1);
  assert.equal(outline[0].text, 'Architecture Overview');
  assert.equal(outline[0].blockId, 'h1_block');
  assert.equal(outline[1].level, 2);
  assert.equal(outline[1].text, 'Database Design');
});

// ============================================================================
// 8. Validation Middleware Guard Tests (Issue #26, #27, #30, #34)
// ============================================================================

function createMockRes() {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
}

test('[Issue #27] validateDocumentId accepts valid 24-hex ObjectId and mock ID, rejects invalid formats', () => {
  // Valid MongoDB ObjectId
  let calledNext = false;
  const validReq = { params: { id: '507f1f77bcf86cd799439011' } };
  validateDocumentId(validReq, createMockRes(), () => { calledNext = true; });
  assert.equal(calledNext, true);

  // Valid mock doc ID
  calledNext = false;
  const mockReq = { params: { id: 'doc_starter_123' } };
  validateDocumentId(mockReq, createMockRes(), () => { calledNext = true; });
  assert.equal(calledNext, true);

  // Invalid ID format
  const invalidReq = { params: { id: 'invalid-id' } };
  const res = createMockRes();
  calledNext = false;
  validateDocumentId(invalidReq, res, () => { calledNext = true; });
  assert.equal(calledNext, false);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error, 'Validation Error');
  assert.ok(res.body.message.includes('Invalid document ID format'));
});

test('[Issue #26] validateCreateDocument caps title at 255 chars and requires workspaceId', () => {
  // Missing workspaceId
  const res1 = createMockRes();
  let calledNext = false;
  validateCreateDocument({ body: { title: 'Test' } }, res1, () => { calledNext = true; });
  assert.equal(calledNext, false);
  assert.equal(res1.statusCode, 400);
  assert.ok(res1.body.message.includes('workspaceId is required'));

  // Title over 255 chars
  const res2 = createMockRes();
  calledNext = false;
  validateCreateDocument({ body: { workspaceId: 'ws-1', title: 'a'.repeat(256) } }, res2, () => { calledNext = true; });
  assert.equal(calledNext, false);
  assert.equal(res2.statusCode, 400);
  assert.ok(res2.body.message.includes('255 characters'));

  // Valid create request
  const validReq = { body: { workspaceId: 'ws-1', title: '  Valid Title  ' } };
  calledNext = false;
  validateCreateDocument(validReq, createMockRes(), () => { calledNext = true; });
  assert.equal(calledNext, true);
  assert.equal(validReq.body.title, 'Valid Title');
});

test('[Issue #30 & #6] validateAttachment enforces MIME type whitelist and safe downloadUrl', () => {
  // Unsafe MIME type
  const resSvg = createMockRes();
  let calledNext = false;
  validateAttachment(
    { body: { fileId: 'f1', fileName: 'icon.svg', mimeType: 'image/svg+xml' } },
    resSvg,
    () => { calledNext = true; }
  );
  assert.equal(calledNext, false);
  assert.equal(resSvg.statusCode, 400);
  assert.ok(resSvg.body.message.includes('Unsupported or unsafe attachment MIME type'));

  // Unsafe downloadUrl (javascript scheme)
  const resJs = createMockRes();
  calledNext = false;
  validateAttachment(
    { body: { fileId: 'f1', fileName: 'img.png', mimeType: 'image/png', downloadUrl: 'javascript:alert(1)' } },
    resJs,
    () => { calledNext = true; }
  );
  assert.equal(calledNext, false);
  assert.equal(resJs.statusCode, 400);
  assert.ok(resJs.body.message.includes('unsafe or unsupported protocol'));

  // Valid attachment
  calledNext = false;
  validateAttachment(
    { body: { fileId: 'f1', fileName: 'report.pdf', fileSize: 1024, mimeType: 'application/pdf', downloadUrl: 'https://cdn.example.com/report.pdf' } },
    createMockRes(),
    () => { calledNext = true; }
  );
  assert.equal(calledNext, true);
});

test('[Issue #24 & #9] validateAutosave rejects recursion depth > 30 and invalid baseVersion', () => {
  // Invalid baseVersion
  const resVer = createMockRes();
  let calledNext = false;
  validateAutosave(
    { body: { content: { type: 'doc', content: [] }, baseVersion: -5 } },
    resVer,
    () => { calledNext = true; }
  );
  assert.equal(calledNext, false);
  assert.equal(resVer.statusCode, 400);
  assert.ok(resVer.body.message.includes('baseVersion must be a positive integer'));

  // Deep AST content bomb
  let deepContent = { type: 'text', text: 'bomb' };
  for (let i = 0; i < 35; i++) {
    deepContent = { type: 'node', content: [deepContent] };
  }
  const resBomb = createMockRes();
  calledNext = false;
  validateAutosave(
    { body: { content: deepContent, baseVersion: 1 } },
    resBomb,
    () => { calledNext = true; }
  );
  assert.equal(calledNext, false);
  assert.equal(resBomb.statusCode, 400);
  assert.ok(resBomb.body.message.includes('exceeds maximum allowed nesting depth'));
});
