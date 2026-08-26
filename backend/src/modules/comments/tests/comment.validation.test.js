import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateCreateComment,
  validateReplyToComment,
  validateCommentId,
  validateDocumentIdParam,
} from '../comment.validation.js';

function mockReq(body = {}, params = {}) {
  return { body, params };
}

function mockRes() {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(data) {
      res.body = data;
      return res;
    },
  };
  return res;
}

const VALID_ID = '507f1f77bcf86cd799439011';
const INVALID_ID = 'not-an-object-id';

// ─── validateCreateComment ───────────────────────────────────────────────────

test('validateCreateComment: passes valid payload', () => {
  const req = mockReq({
    documentId: VALID_ID,
    body: 'Looks good',
    anchorType: 'text_selection',
    from: 0,
    to: 10,
  });
  const res = mockRes();
  let called = false;
  validateCreateComment(req, res, () => { called = true; });
  assert.equal(called, true);
  assert.equal(res.statusCode, null);
});

test('validateCreateComment: rejects missing documentId', () => {
  const req = mockReq({ body: 'Hi', anchorType: 'text_selection', from: 0, to: 5 });
  const res = mockRes();
  validateCreateComment(req, res, () => {});
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error, 'Validation Error');
});

test('validateCreateComment: rejects invalid documentId', () => {
  const req = mockReq({
    documentId: INVALID_ID,
    body: 'Hi',
    anchorType: 'text_selection',
    from: 0,
    to: 5,
  });
  const res = mockRes();
  validateCreateComment(req, res, () => {});
  assert.equal(res.statusCode, 400);
});

test('validateCreateComment: rejects missing body', () => {
  const req = mockReq({
    documentId: VALID_ID,
    anchorType: 'text_selection',
    from: 0,
    to: 5,
  });
  const res = mockRes();
  validateCreateComment(req, res, () => {});
  assert.equal(res.statusCode, 400);
});

test('validateCreateComment: rejects empty body', () => {
  const req = mockReq({
    documentId: VALID_ID,
    body: '   ',
    anchorType: 'text_selection',
    from: 0,
    to: 5,
  });
  const res = mockRes();
  validateCreateComment(req, res, () => {});
  assert.equal(res.statusCode, 400);
});

test('validateCreateComment: rejects missing anchorType', () => {
  const req = mockReq({
    documentId: VALID_ID,
    body: 'Hi',
    from: 0,
    to: 5,
  });
  const res = mockRes();
  validateCreateComment(req, res, () => {});
  assert.equal(res.statusCode, 400);
});

test('validateCreateComment: rejects invalid anchorType', () => {
  const req = mockReq({
    documentId: VALID_ID,
    body: 'Hi',
    anchorType: 'invalid',
    from: 0,
    to: 5,
  });
  const res = mockRes();
  validateCreateComment(req, res, () => {});
  assert.equal(res.statusCode, 400);
});

test('validateCreateComment: accepts block_node anchorType', () => {
  const req = mockReq({
    documentId: VALID_ID,
    body: 'Block comment',
    anchorType: 'block_node',
    from: 0,
    to: 0,
  });
  const res = mockRes();
  let called = false;
  validateCreateComment(req, res, () => { called = true; });
  assert.equal(called, true);
});

test('validateCreateComment: rejects non-number from', () => {
  const req = mockReq({
    documentId: VALID_ID,
    body: 'Hi',
    anchorType: 'text_selection',
    from: 'abc',
    to: 5,
  });
  const res = mockRes();
  validateCreateComment(req, res, () => {});
  assert.equal(res.statusCode, 400);
});

test('validateCreateComment: rejects negative from', () => {
  const req = mockReq({
    documentId: VALID_ID,
    body: 'Hi',
    anchorType: 'text_selection',
    from: -1,
    to: 5,
  });
  const res = mockRes();
  validateCreateComment(req, res, () => {});
  assert.equal(res.statusCode, 400);
});

test('validateCreateComment: rejects to < from', () => {
  const req = mockReq({
    documentId: VALID_ID,
    body: 'Hi',
    anchorType: 'text_selection',
    from: 10,
    to: 5,
  });
  const res = mockRes();
  validateCreateComment(req, res, () => {});
  assert.equal(res.statusCode, 400);
});

test('validateCreateComment: accepts to === from', () => {
  const req = mockReq({
    documentId: VALID_ID,
    body: 'Hi',
    anchorType: 'text_selection',
    from: 5,
    to: 5,
  });
  const res = mockRes();
  let called = false;
  validateCreateComment(req, res, () => { called = true; });
  assert.equal(called, true);
});

test('validateCreateComment: rejects non-array mentions', () => {
  const req = mockReq({
    documentId: VALID_ID,
    body: 'Hi',
    anchorType: 'text_selection',
    from: 0,
    to: 5,
    mentions: 'not-array',
  });
  const res = mockRes();
  validateCreateComment(req, res, () => {});
  assert.equal(res.statusCode, 400);
});

test('validateCreateComment: rejects invalid mention ID', () => {
  const req = mockReq({
    documentId: VALID_ID,
    body: 'Hi',
    anchorType: 'text_selection',
    from: 0,
    to: 5,
    mentions: [INVALID_ID],
  });
  const res = mockRes();
  validateCreateComment(req, res, () => {});
  assert.equal(res.statusCode, 400);
});

test('validateCreateComment: accepts valid mentions array', () => {
  const req = mockReq({
    documentId: VALID_ID,
    body: 'Hi',
    anchorType: 'text_selection',
    from: 0,
    to: 5,
    mentions: [VALID_ID],
  });
  const res = mockRes();
  let called = false;
  validateCreateComment(req, res, () => { called = true; });
  assert.equal(called, true);
});

test('validateCreateComment: accepts null mentions', () => {
  const req = mockReq({
    documentId: VALID_ID,
    body: 'Hi',
    anchorType: 'text_selection',
    from: 0,
    to: 5,
    mentions: null,
  });
  const res = mockRes();
  let called = false;
  validateCreateComment(req, res, () => { called = true; });
  assert.equal(called, true);
});

test('validateCreateComment: rejects invalid parentComment', () => {
  const req = mockReq({
    documentId: VALID_ID,
    body: 'Hi',
    anchorType: 'text_selection',
    from: 0,
    to: 5,
    parentComment: INVALID_ID,
  });
  const res = mockRes();
  validateCreateComment(req, res, () => {});
  assert.equal(res.statusCode, 400);
});

test('validateCreateComment: accepts valid parentComment', () => {
  const req = mockReq({
    documentId: VALID_ID,
    body: 'Hi',
    anchorType: 'text_selection',
    from: 0,
    to: 5,
    parentComment: VALID_ID,
  });
  const res = mockRes();
  let called = false;
  validateCreateComment(req, res, () => { called = true; });
  assert.equal(called, true);
});

// ─── validateReplyToComment ──────────────────────────────────────────────────

test('validateReplyToComment: passes valid payload', () => {
  const req = mockReq(
    { documentId: VALID_ID, body: 'Reply', anchorType: 'text_selection', from: 0, to: 3 },
    { commentId: VALID_ID },
  );
  const res = mockRes();
  let called = false;
  validateReplyToComment(req, res, () => { called = true; });
  assert.equal(called, true);
});

test('validateReplyToComment: rejects invalid commentId param', () => {
  const req = mockReq(
    { documentId: VALID_ID, body: 'Reply', anchorType: 'text_selection', from: 0, to: 3 },
    { commentId: INVALID_ID },
  );
  const res = mockRes();
  validateReplyToComment(req, res, () => {});
  assert.equal(res.statusCode, 400);
});

test('validateReplyToComment: rejects invalid documentId', () => {
  const req = mockReq(
    { documentId: INVALID_ID, body: 'Reply', anchorType: 'text_selection', from: 0, to: 3 },
    { commentId: VALID_ID },
  );
  const res = mockRes();
  validateReplyToComment(req, res, () => {});
  assert.equal(res.statusCode, 400);
});

test('validateReplyToComment: rejects empty body', () => {
  const req = mockReq(
    { documentId: VALID_ID, body: '', anchorType: 'text_selection', from: 0, to: 3 },
    { commentId: VALID_ID },
  );
  const res = mockRes();
  validateReplyToComment(req, res, () => {});
  assert.equal(res.statusCode, 400);
});

test('validateReplyToComment: rejects invalid anchorType', () => {
  const req = mockReq(
    { documentId: VALID_ID, body: 'Reply', anchorType: 'bold', from: 0, to: 3 },
    { commentId: VALID_ID },
  );
  const res = mockRes();
  validateReplyToComment(req, res, () => {});
  assert.equal(res.statusCode, 400);
});

test('validateReplyToComment: rejects to < from', () => {
  const req = mockReq(
    { documentId: VALID_ID, body: 'Reply', anchorType: 'text_selection', from: 10, to: 3 },
    { commentId: VALID_ID },
  );
  const res = mockRes();
  validateReplyToComment(req, res, () => {});
  assert.equal(res.statusCode, 400);
});

test('validateReplyToComment: rejects invalid mention ID', () => {
  const req = mockReq(
    {
      documentId: VALID_ID,
      body: 'Reply',
      anchorType: 'text_selection',
      from: 0,
      to: 3,
      mentions: [INVALID_ID],
    },
    { commentId: VALID_ID },
  );
  const res = mockRes();
  validateReplyToComment(req, res, () => {});
  assert.equal(res.statusCode, 400);
});

// ─── validateCommentId ───────────────────────────────────────────────────────

test('validateCommentId: passes with valid ID', () => {
  const req = mockReq({}, { commentId: VALID_ID });
  const res = mockRes();
  let called = false;
  validateCommentId(req, res, () => { called = true; });
  assert.equal(called, true);
});

test('validateCommentId: rejects invalid ID', () => {
  const req = mockReq({}, { commentId: INVALID_ID });
  const res = mockRes();
  validateCommentId(req, res, () => {});
  assert.equal(res.statusCode, 400);
  assert.ok(res.body.message.includes('Invalid comment ID'));
});

// ─── validateDocumentIdParam ─────────────────────────────────────────────────

test('validateDocumentIdParam: passes with valid ID', () => {
  const req = mockReq({}, { documentId: VALID_ID });
  const res = mockRes();
  let called = false;
  validateDocumentIdParam(req, res, () => { called = true; });
  assert.equal(called, true);
});

test('validateDocumentIdParam: rejects invalid ID', () => {
  const req = mockReq({}, { documentId: INVALID_ID });
  const res = mockRes();
  validateDocumentIdParam(req, res, () => {});
  assert.equal(res.statusCode, 400);
  assert.ok(res.body.message.includes('Invalid document ID'));
});
