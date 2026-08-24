import mongoose from 'mongoose';
import { WORKSPACE_ROLES } from '../models/WorkspaceMember.js';
import { SHARING_VISIBILITY } from '../models/Workspace.js';
import { AppError } from '../utils/AppError.js';

export function validateObjectId(value, label = 'id') {
  if (!value || !mongoose.isValidObjectId(value)) {
    throw new AppError(`Invalid ${label}`, 400);
  }
  return value;
}

export function validateWorkspaceInput({ name, description } = {}, { partial = false } = {}) {
  const result = {};

  if (!partial || name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      throw new AppError('Workspace name is required', 400);
    }
    if (name.trim().length > 120) {
      throw new AppError('Workspace name must be 120 characters or fewer', 400);
    }
    result.name = name.trim();
  }

  if (description !== undefined) {
    if (typeof description !== 'string') {
      throw new AppError('Workspace description must be a string', 400);
    }
    if (description.length > 500) {
      throw new AppError('Workspace description must be 500 characters or fewer', 400);
    }
    result.description = description.trim();
  }

  return result;
}

export function validateRole(role) {
  if (!Object.values(WORKSPACE_ROLES).includes(role)) {
    throw new AppError(
      `Invalid role. Must be one of: ${Object.values(WORKSPACE_ROLES).join(', ')}`,
      400,
    );
  }
  return role;
}

export function validateSharingVisibility(visibility) {
  if (!Object.values(SHARING_VISIBILITY).includes(visibility)) {
    throw new AppError(
      `Invalid sharing visibility. Must be one of: ${Object.values(SHARING_VISIBILITY).join(', ')}`,
      400,
    );
  }
  return visibility;
}

export function validateFolderInput({ name, parentFolderId } = {}, { partial = false } = {}) {
  const result = {};

  if (!partial || name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      throw new AppError('Folder name is required', 400);
    }
    if (name.trim().length > 150) {
      throw new AppError('Folder name must be 150 characters or fewer', 400);
    }
    result.name = name.trim();
  }

  if (parentFolderId !== undefined && parentFolderId !== null) {
    validateObjectId(parentFolderId, 'parent folder id');
    result.parentFolderId = parentFolderId;
  } else if (parentFolderId === null) {
    result.parentFolderId = null;
  }

  return result;
}

export function validateTeamInput({ name } = {}) {
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new AppError('Team name is required', 400);
  }
  if (name.trim().length > 120) {
    throw new AppError('Team name must be 120 characters or fewer', 400);
  }
  return { name: name.trim() };
}
