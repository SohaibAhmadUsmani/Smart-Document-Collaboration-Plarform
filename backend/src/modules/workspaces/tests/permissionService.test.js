import test from 'node:test';
import assert from 'node:assert/strict';
import { permissionService } from '../services/permissionService.js';

const { roleSatisfiesAction, WORKSPACE_ROLES } = permissionService;

test('VIEWER can view but not comment, edit, or manage', () => {
  assert.equal(roleSatisfiesAction(WORKSPACE_ROLES.VIEWER, 'view'), true);
  assert.equal(roleSatisfiesAction(WORKSPACE_ROLES.VIEWER, 'comment'), false);
  assert.equal(roleSatisfiesAction(WORKSPACE_ROLES.VIEWER, 'edit'), false);
  assert.equal(roleSatisfiesAction(WORKSPACE_ROLES.VIEWER, 'manage'), false);
});

test('COMMENTER can view and comment but not edit or manage', () => {
  assert.equal(roleSatisfiesAction(WORKSPACE_ROLES.COMMENTER, 'view'), true);
  assert.equal(roleSatisfiesAction(WORKSPACE_ROLES.COMMENTER, 'comment'), true);
  assert.equal(roleSatisfiesAction(WORKSPACE_ROLES.COMMENTER, 'edit'), false);
  assert.equal(roleSatisfiesAction(WORKSPACE_ROLES.COMMENTER, 'manage'), false);
});

test('EDITOR can view, comment, and edit but not manage', () => {
  assert.equal(roleSatisfiesAction(WORKSPACE_ROLES.EDITOR, 'view'), true);
  assert.equal(roleSatisfiesAction(WORKSPACE_ROLES.EDITOR, 'comment'), true);
  assert.equal(roleSatisfiesAction(WORKSPACE_ROLES.EDITOR, 'edit'), true);
  assert.equal(roleSatisfiesAction(WORKSPACE_ROLES.EDITOR, 'manage'), false);
});

test('OWNER can do everything', () => {
  for (const action of ['view', 'comment', 'edit', 'manage']) {
    assert.equal(roleSatisfiesAction(WORKSPACE_ROLES.OWNER, action), true);
  }
});

test('a null/missing role satisfies nothing', () => {
  for (const action of ['view', 'comment', 'edit', 'manage']) {
    assert.equal(roleSatisfiesAction(null, action), false);
  }
});

test('unknown action throws instead of silently allowing/denying', () => {
  assert.throws(() => roleSatisfiesAction(WORKSPACE_ROLES.OWNER, 'delete_everything'));
});

test('isValidObjectId accepts Mongoose ObjectId instances and valid hex strings', async () => {
  const mongoose = (await import('mongoose')).default;
  const objectId = new mongoose.Types.ObjectId();
  assert.equal(permissionService.isValidObjectId(objectId), true);
  assert.equal(permissionService.isValidObjectId(objectId.toString()), true);
  assert.equal(permissionService.isValidObjectId('507f1f77bcf86cd799439011'), true);
  assert.equal(permissionService.isValidObjectId('invalid-id'), false);
  assert.equal(permissionService.isValidObjectId(12345), false);
  assert.equal(permissionService.isValidObjectId(null), false);
  assert.equal(permissionService.isValidObjectId(undefined), false);
});

