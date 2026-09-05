import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import path from 'path';
import { permissionService } from '../workspaces/services/permissionService.js';
import { requireDocumentAccess } from '../../middleware/documentPermissions.js';
import { resolveStoragePath, UPLOAD_ROOT } from '../files-dashboard/file.storage.js';
import { fileRouter } from '../files-dashboard/file.routes.js';
import { errorHandler } from '../../middleware/errorHandler.js';
import { escapeRegex } from '../auth/users.controller.js';
import { DocumentModel } from '../documents/document.model.js';

// ─── 1. permissionService.isValidObjectId ─────────────────────────────────────

test('[Security Fix #1] isValidObjectId accepts Mongoose ObjectId instances and hex strings', () => {
  const objectId = new mongoose.Types.ObjectId();
  assert.equal(permissionService.isValidObjectId(objectId), true);
  assert.equal(permissionService.isValidObjectId(objectId.toString()), true);
  assert.equal(permissionService.isValidObjectId('507f1f77bcf86cd799439011'), true);
  assert.equal(permissionService.isValidObjectId('not-a-valid-id'), false);
  assert.equal(permissionService.isValidObjectId(''), false);
  assert.equal(permissionService.isValidObjectId(null), false);
  assert.equal(permissionService.isValidObjectId(undefined), false);
  assert.equal(permissionService.isValidObjectId(12345), false);
  assert.equal(permissionService.isValidObjectId({}), false);
});

// ─── 2. file.storage resolveStoragePath directory traversal prevention ──────

test('[Security Fix #2] resolveStoragePath sanitizes keys and prevents directory traversal', () => {
  const normalPath = resolveStoragePath('sample-document.pdf');
  assert.equal(normalPath, path.resolve(UPLOAD_ROOT, 'sample-document.pdf'));

  // Directory traversal attacks must be neutralized via path.basename
  const traversalKey = '../../etc/passwd';
  const resolvedTraversal = resolveStoragePath(traversalKey);
  assert.equal(resolvedTraversal, path.resolve(UPLOAD_ROOT, 'passwd'));
  assert.ok(resolvedTraversal.startsWith(UPLOAD_ROOT));

  // Traversal to root or parent directories should throw
  assert.throws(() => resolveStoragePath('..'), /directory traversal/i);
  assert.throws(() => resolveStoragePath('.'), /directory traversal/i);
  assert.throws(() => resolveStoragePath(''), /Invalid storage key/i);
  assert.throws(() => resolveStoragePath(null), /Invalid storage key/i);
});

// ─── 3. file.routes requireAuth order ────────────────────────────────────────

test('[Security Fix #3] fileRouter applies requireAuth before download route', () => {
  // Inspect router layer stack to verify requireAuth executes before /download route
  const stack = fileRouter.stack;
  const requireAuthIndex = stack.findIndex(
    layer => layer.name === 'requireAuth' || (layer.handle && layer.handle.name === 'requireAuth')
  );
  const downloadRouteIndex = stack.findIndex(
    layer => layer.route && layer.route.path === '/download/:storageKey'
  );

  assert.ok(requireAuthIndex !== -1, 'requireAuth middleware should be registered');
  assert.ok(downloadRouteIndex !== -1, 'download route should be registered');
  assert.ok(
    requireAuthIndex < downloadRouteIndex,
    `requireAuth (index ${requireAuthIndex}) must be registered BEFORE download route (index ${downloadRouteIndex})`
  );
});

// ─── 4. errorHandler status / statusCode resolution ──────────────────────────

test('[Security Fix #4] errorHandler supports error.status ?? error.statusCode ?? 500', () => {
  // Test error with statusCode
  let responseStatusCode = null;
  let responseJson = null;
  const mockRes1 = {
    headersSent: false,
    status(code) {
      responseStatusCode = code;
      return this;
    },
    json(body) {
      responseJson = body;
      return this;
    },
  };

  const errWithStatusCode = new Error('Resource missing');
  errWithStatusCode.statusCode = 404;
  errorHandler(errWithStatusCode, {}, mockRes1, () => {});
  assert.equal(responseStatusCode, 404);
  assert.equal(responseJson.error, 'Resource missing');

  // Test error with status
  const mockRes2 = {
    headersSent: false,
    status(code) {
      responseStatusCode = code;
      return this;
    },
    json(body) {
      responseJson = body;
      return this;
    },
  };

  const errWithStatus = new Error('Unauthorized action');
  errWithStatus.status = 403;
  errorHandler(errWithStatus, {}, mockRes2, () => {});
  assert.equal(responseStatusCode, 403);
  assert.equal(responseJson.error, 'Unauthorized action');

  // Test error with default 500
  const mockRes3 = {
    headersSent: false,
    status(code) {
      responseStatusCode = code;
      return this;
    },
    json(body) {
      responseJson = body;
      return this;
    },
  };

  const errDefault = new Error('Something broke');
  errorHandler(errDefault, {}, mockRes3, () => {});
  assert.equal(responseStatusCode, 500);
  assert.equal(responseJson.error, 'Internal Server Error');

  // Test MongoServerSelectionError returns 503 Service Unavailable with Retry-After header
  let setHeaderCalled = false;
  const mockResMongo = {
    headersSent: false,
    set(header, value) {
      if (header === 'Retry-After' && value === '3') setHeaderCalled = true;
      return this;
    },
    status(code) {
      responseStatusCode = code;
      return this;
    },
    json(body) {
      responseJson = body;
      return this;
    },
  };
  const mongoErr = new Error('connection <monitor> to 159.41.183.54:27017 timed out');
  mongoErr.name = 'MongoServerSelectionError';
  errorHandler(mongoErr, {}, mockResMongo, () => {});
  assert.equal(responseStatusCode, 503);
  assert.equal(responseJson.error, 'Service Unavailable');
  assert.equal(setHeaderCalled, true);
});

// ─── 5. users.controller escapeRegex ─────────────────────────────────────────

test('[Security Fix #5] escapeRegex neutralizes regex injection characters', () => {
  const dangerousQuery = '.*+?^${}()|[]\\test';
  const escaped = escapeRegex(dangerousQuery);
  assert.equal(escaped, '\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\test');
  assert.equal(escapeRegex(''), '');
  assert.equal(escapeRegex(null), '');
  assert.equal(escapeRegex(123), '');

  // Ensure constructing RegExp from escaped query does not throw or act as pattern
  const re = new RegExp(escaped, 'i');
  assert.ok(re.test('.*+?^${}()|[]\\test'));
  assert.ok(!re.test('test'));
});

// ─── 6. documentPermissions requireDocumentAccess ─────────────────────────────

test('[Security Fix #6] requireDocumentAccess fails closed when documentId is missing', async () => {
  const middleware = requireDocumentAccess('view');
  let status = null;
  let json = null;
  let nextCalled = false;

  const mockRes = {
    status(code) {
      status = code;
      return this;
    },
    json(body) {
      json = body;
      return this;
    },
  };

  const mockReq = {
    params: {},
    body: {},
    query: {},
    user: { id: '507f1f77bcf86cd799439011' },
  };

  await middleware(mockReq, mockRes, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false, 'Middleware should NOT call next() when documentId is missing');
  assert.equal(status, 400);
  assert.equal(json.error, 'Bad Request');
  assert.equal(json.message, 'Document ID is required.');
});

test('[Security Fix #6] requireDocumentAccess fails with 400 on invalid documentId format', async () => {
  const middleware = requireDocumentAccess('view');
  let status = null;
  let json = null;

  const mockRes = {
    status(code) {
      status = code;
      return this;
    },
    json(body) {
      json = body;
      return this;
    },
  };

  const mockReq = {
    params: { id: 'invalid-doc-id' },
    user: { id: '507f1f77bcf86cd799439011' },
  };

  await middleware(mockReq, mockRes, () => {});
  assert.equal(status, 400);
  assert.match(json.message, /Invalid document ID format/i);
});

test('[Security Fix #6] requireDocumentAccess denies access when user has no workspace membership', async () => {
  const fakeDocId = new mongoose.Types.ObjectId().toString();
  const fakeWorkspaceId = new mongoose.Types.ObjectId().toString();
  const fakeUserId = new mongoose.Types.ObjectId().toString();

  // Stub DocumentModel.findById
  const origFindById = DocumentModel.findById;
  DocumentModel.findById = () => ({
    lean: () => ({
      exec: async () => ({
        _id: fakeDocId,
        workspaceId: fakeWorkspaceId,
        createdBy: 'some-other-user',
      }),
    }),
  });

  // Stub permissionService.getUserRole to return null (not a member)
  const origGetUserRole = permissionService.getUserRole;
  permissionService.getUserRole = async () => null;

  try {
    const middleware = requireDocumentAccess('view');
    let status = null;
    let json = null;
    let nextCalled = false;

    const mockRes = {
      status(code) {
        status = code;
        return this;
      },
      json(body) {
        json = body;
        return this;
      },
    };

    const mockReq = {
      params: { id: fakeDocId },
      user: { id: fakeUserId, role: 'owner' }, // Spoofed token role should be ignored!
    };

    await middleware(mockReq, mockRes, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(status, 403);
    assert.match(json.message, /Access denied/i);
  } finally {
    DocumentModel.findById = origFindById;
    permissionService.getUserRole = origGetUserRole;
  }
});

test('[Security Fix #6] requireDocumentAccess enforces view/edit/delete according to workspace role', async () => {
  const fakeDocId = new mongoose.Types.ObjectId().toString();
  const fakeWorkspaceId = new mongoose.Types.ObjectId().toString();
  const fakeUserId = new mongoose.Types.ObjectId().toString();

  const origFindById = DocumentModel.findById;
  DocumentModel.findById = () => ({
    lean: () => ({
      exec: async () => ({
        _id: fakeDocId,
        workspaceId: fakeWorkspaceId,
        createdBy: 'doc-creator-id',
      }),
    }),
  });

  const origGetUserRole = permissionService.getUserRole;

  try {
    // 1. VIEWER cannot edit
    permissionService.getUserRole = async () => 'VIEWER';
    let status = null;
    let json = null;
    let nextCalled = false;

    const mockRes = {
      status(code) {
        status = code;
        return this;
      },
      json(body) {
        json = body;
        return this;
      },
    };

    const editMiddleware = requireDocumentAccess('edit');
    await editMiddleware(
      { params: { id: fakeDocId }, user: { id: fakeUserId } },
      mockRes,
      () => {
        nextCalled = true;
      }
    );
    assert.equal(nextCalled, false);
    assert.equal(status, 403);
    assert.match(json.message, /Edit permission required/i);

    // 2. VIEWER CAN view
    nextCalled = false;
    const viewMiddleware = requireDocumentAccess('view');
    const reqObj = { params: { id: fakeDocId }, user: { id: fakeUserId } };
    await viewMiddleware(reqObj, mockRes, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
    assert.equal(reqObj.docPermission.canView, true);
    assert.equal(reqObj.docPermission.canEdit, false);
    assert.equal(reqObj.docPermission.canDelete, false);

    // 3. EDITOR CAN edit but NOT delete (unless creator)
    permissionService.getUserRole = async () => 'EDITOR';
    nextCalled = false;
    await editMiddleware(reqObj, mockRes, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
    assert.equal(reqObj.docPermission.canEdit, true);

    nextCalled = false;
    const deleteMiddleware = requireDocumentAccess('delete');
    await deleteMiddleware(reqObj, mockRes, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, false);
    assert.equal(status, 403);
    assert.match(json.message, /Delete permission required/i);

    // 4. OWNER CAN delete
    permissionService.getUserRole = async () => 'OWNER';
    nextCalled = false;
    await deleteMiddleware(reqObj, mockRes, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
    assert.equal(reqObj.docPermission.canDelete, true);
  } finally {
    DocumentModel.findById = origFindById;
    permissionService.getUserRole = origGetUserRole;
  }
});
