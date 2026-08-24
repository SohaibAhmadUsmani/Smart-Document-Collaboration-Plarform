import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateWorkspaceInput,
  validateRole,
  validateSharingVisibility,
  validateFolderInput,
} from '../validators/workspaceValidators.js';

test('validateWorkspaceInput requires a non-empty name on create', () => {
  assert.throws(() => validateWorkspaceInput({}));
  assert.throws(() => validateWorkspaceInput({ name: '   ' }));
});

test('validateWorkspaceInput trims and accepts a valid name', () => {
  const result = validateWorkspaceInput({ name: '  My Workspace  ' });
  assert.equal(result.name, 'My Workspace');
});

test('validateWorkspaceInput allows a partial update with no name', () => {
  const result = validateWorkspaceInput({ description: 'updated' }, { partial: true });
  assert.equal(result.name, undefined);
  assert.equal(result.description, 'updated');
});

test('validateWorkspaceInput rejects mass-assignment style fields silently by ignoring them', () => {

  const result = validateWorkspaceInput(
    { name: 'ok', owner: 'attacker-id', sharing: { visibility: 'ANYONE_WITH_LINK' } },
    { partial: true },
  );
  assert.equal(result.owner, undefined);
  assert.equal(result.sharing, undefined);
});

test('validateRole only accepts known roles', () => {
  assert.equal(validateRole('EDITOR'), 'EDITOR');
  assert.throws(() => validateRole('SUPERADMIN'));
});

test('validateSharingVisibility only accepts known values', () => {
  assert.equal(validateSharingVisibility('PRIVATE'), 'PRIVATE');
  assert.throws(() => validateSharingVisibility('PUBLIC'));
});

test('validateFolderInput requires a name on create', () => {
  assert.throws(() => validateFolderInput({}));
});

test('validateFolderInput accepts a null parentFolderId to mean root-level', () => {
  const result = validateFolderInput({ name: 'Root Folder', parentFolderId: null });
  assert.equal(result.parentFolderId, null);
});
