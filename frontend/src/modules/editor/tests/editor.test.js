import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeLinkUrl, isValidLinkUrl } from '../extensions/schema.js';
import { documentEditorReducer, initialEditorState } from '../context/documentEditorReducer.js';
import { DOCUMENT_ACTIONS, SAVE_STATUS, MAX_OFFLINE_REVISIONS } from '../types/document.js';
import { astToMarkdown, extractPlainTextFromAst } from '../utils/astConverters.js';

test('sanitizeLinkUrl strips dangerous javascript:, vbscript:, and data: schemes', () => {
  assert.equal(sanitizeLinkUrl('javascript:alert(1)'), '');
  assert.equal(sanitizeLinkUrl('vbscript:msgbox(1)'), '');
  assert.equal(sanitizeLinkUrl('data:text/html,<script>alert(1)</script>'), '');
  assert.equal(sanitizeLinkUrl('https://example.com/path?a=1'), 'https://example.com/path?a=1');
  assert.equal(sanitizeLinkUrl('http://example.com'), 'http://example.com');
  assert.equal(sanitizeLinkUrl('docsync.com/page'), 'https://docsync.com/page');
  assert.equal(sanitizeLinkUrl('mailto:user@test.com'), 'mailto:user@test.com');
  assert.equal(sanitizeLinkUrl('#heading-1'), '#heading-1');
});

test('isValidLinkUrl correctly identifies safe and unsafe URLs', () => {
  assert.equal(isValidLinkUrl('javascript:void(0)'), false);
  assert.equal(isValidLinkUrl('vbscript:run()'), false);
  assert.equal(isValidLinkUrl('data:text/html,abc'), false);
  assert.equal(isValidLinkUrl('https://docsync.pro'), true);
  assert.equal(isValidLinkUrl('mailto:support@docsync.pro'), true);
  assert.equal(isValidLinkUrl('#section-1'), true);
  assert.equal(isValidLinkUrl('/workspace/doc1'), true);
});

test('documentEditorReducer handles SET_CONFLICT action', () => {
  const conflictPayload = {
    serverDocument: { version: 5, content: { type: 'doc', content: [] }, title: 'Remote Version' },
    localContent: { type: 'doc', content: [{ type: 'paragraph' }] },
    error: 'Version conflict detected',
  };

  const newState = documentEditorReducer(initialEditorState, {
    type: DOCUMENT_ACTIONS.SET_CONFLICT,
    payload: conflictPayload,
  });

  assert.equal(newState.saveStatus, SAVE_STATUS.CONFLICT);
  assert.deepEqual(newState.conflictData, conflictPayload);
  assert.equal(newState.saveError, 'Version conflict detected');
});

test('documentEditorReducer handles RESOLVE_CONFLICT with keep_server', () => {
  const serverDoc = {
    version: 10,
    title: 'Server Master Doc',
    content: { type: 'doc', content: [{ type: 'paragraph', text: 'Server Text' }] },
    plainText: 'Server Text',
  };

  const stateWithConflict = {
    ...initialEditorState,
    saveStatus: SAVE_STATUS.CONFLICT,
    conflictData: { serverDocument: serverDoc },
  };

  const resolvedState = documentEditorReducer(stateWithConflict, {
    type: DOCUMENT_ACTIONS.RESOLVE_CONFLICT,
    payload: {
      resolution: 'keep_server',
      serverDocument: serverDoc,
    },
  });

  assert.equal(resolvedState.saveStatus, SAVE_STATUS.SAVED);
  assert.equal(resolvedState.version, 10);
  assert.equal(resolvedState.title, 'Server Master Doc');
  assert.equal(resolvedState.conflictData, null);
  assert.equal(resolvedState.isDirty, false);
});

test('documentEditorReducer handles RESOLVE_CONFLICT with keep_local', () => {
  const stateWithConflict = {
    ...initialEditorState,
    version: 2,
    saveStatus: SAVE_STATUS.CONFLICT,
    conflictData: { serverDocument: { version: 5 } },
    isDirty: false,
  };

  const resolvedState = documentEditorReducer(stateWithConflict, {
    type: DOCUMENT_ACTIONS.RESOLVE_CONFLICT,
    payload: {
      resolution: 'keep_local',
      serverVersion: 5,
    },
  });

  assert.equal(resolvedState.saveStatus, SAVE_STATUS.IDLE);
  assert.equal(resolvedState.version, 5);
  assert.equal(resolvedState.conflictData, null);
  assert.equal(resolvedState.isDirty, true);
});

test('documentEditorReducer handles RESOLVE_CONFLICT with merge', () => {
  const stateWithConflict = {
    ...initialEditorState,
    version: 2,
    saveStatus: SAVE_STATUS.CONFLICT,
    conflictData: { serverDocument: { version: 6 } },
  };

  const mergedAST = {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Merged content' }] }],
  };

  const resolvedState = documentEditorReducer(stateWithConflict, {
    type: DOCUMENT_ACTIONS.RESOLVE_CONFLICT,
    payload: {
      resolution: 'merge',
      mergedContent: mergedAST,
      mergedPlainText: 'Merged content',
      serverVersion: 6,
    },
  });

  assert.equal(resolvedState.saveStatus, SAVE_STATUS.IDLE);
  assert.equal(resolvedState.version, 6);
  assert.deepEqual(resolvedState.content, mergedAST);
  assert.equal(resolvedState.plainText, 'Merged content');
  assert.equal(resolvedState.conflictData, null);
  assert.equal(resolvedState.isDirty, true);
});

test('documentEditorReducer handles SET_SAVING_BEACON', () => {
  const state = documentEditorReducer(initialEditorState, {
    type: DOCUMENT_ACTIONS.SET_SAVING_BEACON,
    payload: true,
  });

  assert.equal(state.isBeaconPending, true);
});

test('MAX_OFFLINE_REVISIONS is bounded to 20', () => {
  assert.equal(MAX_OFFLINE_REVISIONS, 20);
});

test('astToMarkdown converts AST headings, callouts, code blocks, tables, and links', () => {
  const ast = {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'Document Title' }],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'This is ' },
          { type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
          { type: 'text', text: ' and ' },
          { type: 'text', text: 'a link', marks: [{ type: 'link', attrs: { href: 'https://docsync.pro' } }] },
        ],
      },
      {
        type: 'callout',
        attrs: { type: 'warning' },
        content: [{ type: 'text', text: 'Important alert note' }],
      },
      {
        type: 'codeBlock',
        attrs: { language: 'js' },
        content: [{ type: 'text', text: 'const a = 10;' }],
      },
    ],
  };

  const md = astToMarkdown(ast);
  assert.match(md, /# Document Title/);
  assert.match(md, /\*\*bold\*\*/);
  assert.match(md, /\[a link\]\(https:\/\/docsync\.pro\)/);
  assert.match(md, /\[!WARNING\]/);
  assert.match(md, /```js/);
});

test('extractPlainTextFromAst extracts recursive plain text', () => {
  const ast = {
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: 'Hello World' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Subheading' }] },
    ],
  };

  const text = extractPlainTextFromAst(ast);
  assert.equal(text, 'Hello World\nSubheading');
});
