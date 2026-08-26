import test from 'node:test';
import assert from 'node:assert/strict';
import { validateNotificationId } from '../notification.validation.js';

function mockReq(params = {}) {
  return { body: {}, params };
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

test('validateNotificationId: passes with valid ID', () => {
  const req = mockReq({ notificationId: VALID_ID });
  const res = mockRes();
  let called = false;
  validateNotificationId(req, res, () => { called = true; });
  assert.equal(called, true);
  assert.equal(res.statusCode, null);
});

test('validateNotificationId: rejects invalid ID format', () => {
  const req = mockReq({ notificationId: INVALID_ID });
  const res = mockRes();
  validateNotificationId(req, res, () => {});
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error, 'Validation Error');
  assert.ok(res.body.message.includes('Invalid notification ID'));
});

test('validateNotificationId: rejects missing notificationId', () => {
  const req = mockReq({});
  const res = mockRes();
  validateNotificationId(req, res, () => {});
  assert.equal(res.statusCode, 400);
});

test('validateNotificationId: rejects empty string', () => {
  const req = mockReq({ notificationId: '' });
  const res = mockRes();
  validateNotificationId(req, res, () => {});
  assert.equal(res.statusCode, 400);
});
