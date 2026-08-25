import { mock, test } from 'node:test';
import assert from 'node:assert/strict';

const VALID_USER_ID = '507f1f77bcf86cd799439011';
const VALID_DOC_ID = '507f1f77bcf86cd799439012';
const VALID_COMMENT_ID = '507f1f77bcf86cd799439013';
const VALID_WORKSPACE_ID = '507f1f77bcf86cd799439014';
const OTHER_USER_ID = '507f1f77bcf86cd799439015';
const INVALID_ID = 'not-an-object-id';

// ─── Mock builders ───────────────────────────────────────────────────────────

function buildQueryChain(result) {
  const chain = {
    _result: result,
    select: mock.fn(() => chain),
    lean: mock.fn(() => chain),
    exec: mock.fn(() => Promise.resolve(chain._result)),
    sort: mock.fn(() => chain),
    populate: mock.fn(() => chain),
  };
  return chain;
}

function buildSaveableDoc(data) {
  const doc = { ...data };
  doc.save = mock.fn(async function () {
    this._id = this._id || VALID_COMMENT_ID;
    return this;
  });
  doc.populate = mock.fn(async function () {
    return this;
  });
  return doc;
}

// ─── Mock data ───────────────────────────────────────────────────────────────

const mockDocument = { workspaceId: VALID_WORKSPACE_ID, createdBy: VALID_USER_ID };
const mockCommentRecord = {
  _id: VALID_COMMENT_ID,
  author: VALID_USER_ID,
  document: VALID_DOC_ID,
  body: 'Test comment',
  resolved: false,
  mentions: [],
  anchorType: 'text_selection',
  from: 0,
  to: 10,
  parentComment: null,
};

// ─── Mock modules ────────────────────────────────────────────────────────────

const mockCommentModel = {
  find: mock.fn(() => buildQueryChain([])),
  findOne: mock.fn(() => buildQueryChain(null)),
  findById: mock.fn(() => buildQueryChain(null)),
  findByIdAndUpdate: mock.fn(() => buildQueryChain(null)),
  findByIdAndDelete: mock.fn(() => buildQueryChain({})),
};

const mockDocumentModel = {
  findOne: mock.fn(() => buildQueryChain(null)),
};

const mockPermissionService = {
  assertPermission: mock.fn(async () => 'COMMENTER'),
  getUserRole: mock.fn(async () => 'EDITOR'),
  WORKSPACE_ROLES: { VIEWER: 'VIEWER', COMMENTER: 'COMMENTER', EDITOR: 'EDITOR', OWNER: 'OWNER' },
};

const mockNotificationService = {
  createMentionNotifications: mock.fn(async () => {}),
};

function MockCommentConstructor(data) {
  return buildSaveableDoc(data);
}
Object.assign(MockCommentConstructor, mockCommentModel);

mock.module('../models/Comment.js', {
  namedExports: { Comment: MockCommentConstructor },
});
mock.module('../../documents/document.model.js', {
  namedExports: { DocumentModel: mockDocumentModel },
});
mock.module('../../workspaces/services/permissionService.js', {
  namedExports: { permissionService: mockPermissionService },
});
mock.module('../../notifications/services/notificationService.js', {
  namedExports: { notificationService: mockNotificationService },
});
// Do NOT mock AppError - the real class works fine and mock.module path resolution
// across module boundaries is unreliable. Tests catch errors and check message/status.

const { commentService } = await import('../services/commentService.js');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function baseArgs(overrides = {}) {
  return {
    documentId: VALID_DOC_ID,
    userId: VALID_USER_ID,
    body: 'Looks good to me',
    anchorType: 'text_selection',
    from: 0,
    to: 20,
    exactQuote: '',
    prefixContext: '',
    suffixContext: '',
    blockId: null,
    mentions: [],
    parentComment: null,
    ...overrides,
  };
}

// ─── createComment ───────────────────────────────────────────────────────────

test('createComment: creates a comment successfully', async () => {
  mockDocumentModel.findOne.mock.mockImplementation(() => buildQueryChain(mockDocument));
  mockPermissionService.assertPermission.mock.mockImplementation(async () => 'COMMENTER');
  mockNotificationService.createMentionNotifications.mock.mockImplementation(async () => undefined);

  const result = await commentService.createComment(baseArgs());
  assert.ok(result, 'should return a comment');
  assert.equal(result.body, 'Looks good to me');
});

test('createComment: rejects invalid document ID format', async () => {
  await assert.rejects(
    () => commentService.createComment(baseArgs({ documentId: INVALID_ID })),
    (err) => { assert.equal(err.status, 400); return true; },
  );
});

test('createComment: rejects when document not found', async () => {
  mockDocumentModel.findOne.mock.mockImplementation(() => buildQueryChain(null));

  await assert.rejects(
    () => commentService.createComment(baseArgs()),
    (err) => { assert.equal(err.status, 404); return true; },
  );
});

test('createComment: rejects when user lacks comment permission', async () => {
  mockDocumentModel.findOne.mock.mockImplementation(() => buildQueryChain(mockDocument));
  mockPermissionService.assertPermission.mock.mockImplementation(async () => { throw new Error('No access'); });

  await assert.rejects(
    () => commentService.createComment(baseArgs()),
    (err) => { assert.equal(err.status, 403); return true; },
  );
});

test('createComment: rejects empty body', async () => {
  mockDocumentModel.findOne.mock.mockImplementation(() => buildQueryChain(mockDocument));
  mockPermissionService.assertPermission.mock.mockImplementation(async () => 'COMMENTER');

  await assert.rejects(
    () => commentService.createComment(baseArgs({ body: '' })),
    (err) => { assert.equal(err.status, 400); return true; },
  );
});

test('createComment: rejects whitespace-only body', async () => {
  mockDocumentModel.findOne.mock.mockImplementation(() => buildQueryChain(mockDocument));
  mockPermissionService.assertPermission.mock.mockImplementation(async () => 'COMMENTER');

  await assert.rejects(
    () => commentService.createComment(baseArgs({ body: '   ' })),
    (err) => { assert.equal(err.status, 400); return true; },
  );
});

test('createComment: rejects invalid anchorType', async () => {
  mockDocumentModel.findOne.mock.mockImplementation(() => buildQueryChain(mockDocument));
  mockPermissionService.assertPermission.mock.mockImplementation(async () => 'COMMENTER');

  await assert.rejects(
    () => commentService.createComment(baseArgs({ anchorType: 'invalid' })),
    (err) => { assert.equal(err.status, 400); return true; },
  );
});

test('createComment: rejects negative from', async () => {
  mockDocumentModel.findOne.mock.mockImplementation(() => buildQueryChain(mockDocument));
  mockPermissionService.assertPermission.mock.mockImplementation(async () => 'COMMENTER');

  await assert.rejects(
    () => commentService.createComment(baseArgs({ from: -1, to: 5 })),
    (err) => { assert.equal(err.status, 400); return true; },
  );
});

test('createComment: rejects to < from', async () => {
  mockDocumentModel.findOne.mock.mockImplementation(() => buildQueryChain(mockDocument));
  mockPermissionService.assertPermission.mock.mockImplementation(async () => 'COMMENTER');

  await assert.rejects(
    () => commentService.createComment(baseArgs({ from: 10, to: 5 })),
    (err) => { assert.equal(err.status, 400); return true; },
  );
});

test('createComment: invalid userId is rejected', async () => {
  await assert.rejects(
    () => commentService.createComment(baseArgs({ userId: INVALID_ID })),
    (err) => { assert.equal(err.status, 400); return true; },
  );
});

test('createComment: parentComment must belong to the same document', async () => {
  mockDocumentModel.findOne.mock.mockImplementation(() => buildQueryChain(mockDocument));
  mockPermissionService.assertPermission.mock.mockImplementation(async () => 'COMMENTER');
  mockCommentModel.findOne.mock.mockImplementation(() => buildQueryChain(null));

  await assert.rejects(
    () => commentService.createComment(baseArgs({ parentComment: VALID_COMMENT_ID })),
    (err) => { assert.equal(err.status, 404); assert.ok(err.message.includes('Parent')); return true; },
  );
});

test('createComment: mentions are deduplicated', async () => {
  mockDocumentModel.findOne.mock.mockImplementation(() => buildQueryChain(mockDocument));
  mockPermissionService.assertPermission.mock.mockImplementation(async () => 'COMMENTER');

  const result = await commentService.createComment(
    baseArgs({ mentions: [OTHER_USER_ID, OTHER_USER_ID, VALID_USER_ID] }),
  );
  assert.equal(result.mentions.length, 1);
  assert.equal(result.mentions[0].toString(), OTHER_USER_ID);
});

test('createComment: self-mentions are removed', async () => {
  mockDocumentModel.findOne.mock.mockImplementation(() => buildQueryChain(mockDocument));
  mockPermissionService.assertPermission.mock.mockImplementation(async () => 'COMMENTER');

  const result = await commentService.createComment(
    baseArgs({ mentions: [VALID_USER_ID] }),
  );
  assert.equal(result.mentions.length, 0);
});

test('createComment: mentions trigger notification creation', async () => {
  mockDocumentModel.findOne.mock.mockImplementation(() => buildQueryChain(mockDocument));
  mockPermissionService.assertPermission.mock.mockImplementation(async () => 'COMMENTER');

  await commentService.createComment(baseArgs({ mentions: [OTHER_USER_ID] }));

  const calls = mockNotificationService.createMentionNotifications.mock.calls;
  assert.ok(calls.length > 0);
  const callArgs = calls[calls.length - 1].arguments[0];
  assert.equal(callArgs.senderId, VALID_USER_ID);
  assert.equal(callArgs.documentId, VALID_DOC_ID);
  assert.equal(callArgs.workspaceId, VALID_WORKSPACE_ID);
});

test('createComment: notification failure does not break comment creation', async () => {
  mockDocumentModel.findOne.mock.mockImplementation(() => buildQueryChain(mockDocument));
  mockPermissionService.assertPermission.mock.mockImplementation(async () => 'COMMENTER');
  mockNotificationService.createMentionNotifications.mock.mockImplementation(async () => { throw new Error('fail'); });

  const result = await commentService.createComment(baseArgs({ mentions: [OTHER_USER_ID] }));
  assert.ok(result);
  assert.equal(result.body, 'Looks good to me');
});

// ─── getDocumentComments ─────────────────────────────────────────────────────

test('getDocumentComments: returns comments for a document', async () => {
  mockDocumentModel.findOne.mock.mockImplementation(() => buildQueryChain(mockDocument));
  mockCommentModel.find.mock.mockImplementation(() => buildQueryChain([mockCommentRecord]));

  const result = await commentService.getDocumentComments(VALID_DOC_ID);
  assert.ok(Array.isArray(result));
  assert.equal(result.length, 1);
  assert.equal(result[0].body, 'Test comment');
});

test('getDocumentComments: rejects invalid document ID', async () => {
  await assert.rejects(
    () => commentService.getDocumentComments(INVALID_ID),
    (err) => { assert.equal(err.status, 400); return true; },
  );
});

test('getDocumentComments: rejects non-existent document', async () => {
  mockDocumentModel.findOne.mock.mockImplementation(() => buildQueryChain(null));

  await assert.rejects(
    () => commentService.getDocumentComments(VALID_DOC_ID),
    (err) => { assert.equal(err.status, 404); return true; },
  );
});

// ─── getCommentById ──────────────────────────────────────────────────────────

test('getCommentById: returns a comment', async () => {
  mockCommentModel.findById.mock.mockImplementation(() => buildQueryChain(mockCommentRecord));

  const result = await commentService.getCommentById(VALID_COMMENT_ID);
  assert.ok(result);
  assert.equal(result._id, VALID_COMMENT_ID);
});

test('getCommentById: rejects invalid ID', async () => {
  await assert.rejects(
    () => commentService.getCommentById(INVALID_ID),
    (err) => { assert.equal(err.status, 400); return true; },
  );
});

test('getCommentById: throws 404 for non-existent comment', async () => {
  mockCommentModel.findById.mock.mockImplementation(() => buildQueryChain(null));

  await assert.rejects(
    () => commentService.getCommentById(VALID_COMMENT_ID),
    (err) => { assert.equal(err.status, 404); return true; },
  );
});

// ─── replyToComment ──────────────────────────────────────────────────────────

test('replyToComment: creates a child comment', async () => {
  mockCommentModel.findOne.mock.mockImplementation(() => buildQueryChain(mockCommentRecord));
  mockDocumentModel.findOne.mock.mockImplementation(() => buildQueryChain(mockDocument));
  mockPermissionService.assertPermission.mock.mockImplementation(async () => 'COMMENTER');

  const result = await commentService.replyToComment({
    commentId: VALID_COMMENT_ID,
    documentId: VALID_DOC_ID,
    userId: VALID_USER_ID,
    body: 'Reply body',
    anchorType: 'text_selection',
    from: 0,
    to: 5,
  });
  assert.ok(result);
  assert.equal(result.body, 'Reply body');
  assert.equal(String(result.parentComment), VALID_COMMENT_ID);
});

test('replyToComment: rejects when parent comment not found', async () => {
  mockCommentModel.findOne.mock.mockImplementation(() => buildQueryChain(null));

  await assert.rejects(
    () => commentService.replyToComment({
      commentId: VALID_COMMENT_ID,
      documentId: VALID_DOC_ID,
      userId: VALID_USER_ID,
      body: 'Reply',
      anchorType: 'text_selection',
      from: 0,
      to: 5,
    }),
    (err) => { assert.equal(err.status, 404); return true; },
  );
});

test('replyToComment: rejects invalid commentId', async () => {
  await assert.rejects(
    () => commentService.replyToComment({
      commentId: INVALID_ID,
      documentId: VALID_DOC_ID,
      userId: VALID_USER_ID,
      body: 'Reply',
      anchorType: 'text_selection',
      from: 0,
      to: 5,
    }),
    (err) => { assert.equal(err.status, 400); return true; },
  );
});

// ─── resolveComment ──────────────────────────────────────────────────────────

test('resolveComment: works for the author', async () => {
  const unresolvedComment = {
    ...mockCommentRecord,
    resolved: false,
    save: mock.fn(async function () { this.resolved = true; return this; }),
    populate: mock.fn(async function () { return this; }),
  };
  const chain = {};
  chain.select = mock.fn(() => chain);
  chain.exec = mock.fn(async () => unresolvedComment);
  mockCommentModel.findById.mock.mockImplementation(() => chain);
  mockDocumentModel.findOne.mock.mockImplementation(() => buildQueryChain(mockDocument));

  const result = await commentService.resolveComment({ commentId: VALID_COMMENT_ID, userId: VALID_USER_ID });
  assert.ok(result);
});

test('resolveComment: allows authorized OWNER users', async () => {
  const commentAsOther = {
    ...mockCommentRecord,
    author: OTHER_USER_ID,
    resolved: false,
    save: mock.fn(async function () { this.resolved = true; return this; }),
    populate: mock.fn(async function () { return this; }),
  };
  const chain = {};
  chain.select = mock.fn(() => chain);
  chain.exec = mock.fn(async () => commentAsOther);
  mockCommentModel.findById.mock.mockImplementation(() => chain);
  mockDocumentModel.findOne.mock.mockImplementation(() => buildQueryChain(mockDocument));
  mockPermissionService.getUserRole.mock.mockImplementation(async () => 'OWNER');

  const result = await commentService.resolveComment({ commentId: VALID_COMMENT_ID, userId: VALID_USER_ID });
  assert.ok(result);
});

test('resolveComment: allows authorized EDITOR users', async () => {
  const commentAsOther = {
    ...mockCommentRecord,
    author: OTHER_USER_ID,
    resolved: false,
    save: mock.fn(async function () { this.resolved = true; return this; }),
    populate: mock.fn(async function () { return this; }),
  };
  const chain = {};
  chain.select = mock.fn(() => chain);
  chain.exec = mock.fn(async () => commentAsOther);
  mockCommentModel.findById.mock.mockImplementation(() => chain);
  mockDocumentModel.findOne.mock.mockImplementation(() => buildQueryChain(mockDocument));
  mockPermissionService.getUserRole.mock.mockImplementation(async () => 'EDITOR');

  const result = await commentService.resolveComment({ commentId: VALID_COMMENT_ID, userId: VALID_USER_ID });
  assert.ok(result);
});

test('resolveComment: rejects unauthorized users', async () => {
  const commentAsOther = { ...mockCommentRecord, author: OTHER_USER_ID };
  const chain = {};
  chain.select = mock.fn(() => chain);
  chain.exec = mock.fn(async () => commentAsOther);
  mockCommentModel.findById.mock.mockImplementation(() => chain);
  // Document NOT created by this user, so creator bypass does not apply
  mockDocumentModel.findOne.mock.mockImplementation(() => buildQueryChain({
    workspaceId: VALID_WORKSPACE_ID,
    createdBy: OTHER_USER_ID,
  }));
  mockPermissionService.getUserRole.mock.mockImplementation(async () => 'VIEWER');

  await assert.rejects(
    () => commentService.resolveComment({ commentId: VALID_COMMENT_ID, userId: VALID_USER_ID }),
    (err) => { assert.ok(err.message.includes('permission') || err.status === 403); return true; },
  );
});

test('resolveComment: rejects invalid commentId', async () => {
  await assert.rejects(
    () => commentService.resolveComment({ commentId: INVALID_ID, userId: VALID_USER_ID }),
    (err) => { assert.equal(err.status, 400); return true; },
  );
});

test('resolveComment: throws 404 for non-existent comment', async () => {
  const chain = {};
  chain.select = mock.fn(() => chain);
  chain.exec = mock.fn(async () => null);
  mockCommentModel.findById.mock.mockImplementation(() => chain);

  await assert.rejects(
    () => commentService.resolveComment({ commentId: VALID_COMMENT_ID, userId: VALID_USER_ID }),
    (err) => { assert.ok(err.message.includes('not found') || err.status === 404); return true; },
  );
});

test('resolveComment: idempotent when already resolved', async () => {
  const alreadyResolved = {
    ...mockCommentRecord,
    resolved: true,
    populate: mock.fn(async function () { return this; }),
  };
  const chain = {};
  chain.select = mock.fn(() => chain);
  chain.exec = mock.fn(async () => alreadyResolved);
  mockCommentModel.findById.mock.mockImplementation(() => chain);
  mockDocumentModel.findOne.mock.mockImplementation(() => buildQueryChain(mockDocument));

  const result = await commentService.resolveComment({ commentId: VALID_COMMENT_ID, userId: VALID_USER_ID });
  assert.ok(result);
  assert.equal(result.resolved, true);
  // populate should have been called (the function returns early with populate)
  assert.ok(alreadyResolved.populate.mock.calls.length > 0);
});

// ─── deleteComment ───────────────────────────────────────────────────────────

test('deleteComment: works for the author', async () => {
  const chain = {};
  chain.select = mock.fn(() => chain);
  chain.exec = mock.fn(async () => mockCommentRecord);
  mockCommentModel.findById.mock.mockImplementation(() => chain);
  mockDocumentModel.findOne.mock.mockImplementation(() => buildQueryChain(mockDocument));

  const result = await commentService.deleteComment({ commentId: VALID_COMMENT_ID, userId: VALID_USER_ID });
  assert.deepStrictEqual(result, { deleted: true });
});

test('deleteComment: allows document creator to delete', async () => {
  const commentAsOther = { ...mockCommentRecord, author: OTHER_USER_ID };
  const chain = {};
  chain.select = mock.fn(() => chain);
  chain.exec = mock.fn(async () => commentAsOther);
  mockCommentModel.findById.mock.mockImplementation(() => chain);
  mockDocumentModel.findOne.mock.mockImplementation(() => buildQueryChain({
    workspaceId: VALID_WORKSPACE_ID,
    createdBy: VALID_USER_ID,
  }));

  const result = await commentService.deleteComment({ commentId: VALID_COMMENT_ID, userId: VALID_USER_ID });
  assert.deepStrictEqual(result, { deleted: true });
});

test('deleteComment: rejects unauthorized users', async () => {
  const commentAsOther = { ...mockCommentRecord, author: OTHER_USER_ID };
  const chain = {};
  chain.select = mock.fn(() => chain);
  chain.exec = mock.fn(async () => commentAsOther);
  mockCommentModel.findById.mock.mockImplementation(() => chain);
  // Document NOT created by this user, so creator bypass does not apply
  mockDocumentModel.findOne.mock.mockImplementation(() => buildQueryChain({
    workspaceId: VALID_WORKSPACE_ID,
    createdBy: OTHER_USER_ID,
  }));
  mockPermissionService.getUserRole.mock.mockImplementation(async () => 'VIEWER');

  await assert.rejects(
    () => commentService.deleteComment({ commentId: VALID_COMMENT_ID, userId: VALID_USER_ID }),
    (err) => { assert.ok(err.message.includes('permission') || err.status === 403); return true; },
  );
});

test('deleteComment: rejects invalid commentId', async () => {
  await assert.rejects(
    () => commentService.deleteComment({ commentId: INVALID_ID, userId: VALID_USER_ID }),
    (err) => { assert.equal(err.status, 400); return true; },
  );
});

test('deleteComment: throws 404 for non-existent comment', async () => {
  const chain = {};
  chain.select = mock.fn(() => chain);
  chain.exec = mock.fn(async () => null);
  mockCommentModel.findById.mock.mockImplementation(() => chain);

  await assert.rejects(
    () => commentService.deleteComment({ commentId: VALID_COMMENT_ID, userId: VALID_USER_ID }),
    (err) => { assert.ok(err.message.includes('not found') || err.status === 404); return true; },
  );
});
