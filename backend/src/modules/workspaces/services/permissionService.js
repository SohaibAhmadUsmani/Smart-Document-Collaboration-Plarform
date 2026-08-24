import mongoose from 'mongoose';
import { WorkspaceMember, WORKSPACE_ROLES } from '../models/WorkspaceMember.js';
import { AppError } from '../utils/AppError.js';

const ROLE_RANK = Object.freeze({
  [WORKSPACE_ROLES.VIEWER]: 0,
  [WORKSPACE_ROLES.COMMENTER]: 1,
  [WORKSPACE_ROLES.EDITOR]: 2,
  [WORKSPACE_ROLES.OWNER]: 3,
});


const ACTION_MIN_ROLE = Object.freeze({
  view: WORKSPACE_ROLES.VIEWER,
  comment: WORKSPACE_ROLES.COMMENTER,
  edit: WORKSPACE_ROLES.EDITOR,
  manage: WORKSPACE_ROLES.OWNER,
});

function isValidObjectId(value) {
  return typeof value === 'string' && mongoose.isValidObjectId(value);
}

function roleSatisfiesAction(role, action) {
  const requiredRole = ACTION_MIN_ROLE[action];
  if (!requiredRole) {
    throw new AppError(`Unknown permission action: ${action}`, 500);
  }
  if (!role) return false;
  return ROLE_RANK[role] >= ROLE_RANK[requiredRole];
}


async function getUserRole(userId, workspaceId) {
  if (!isValidObjectId(userId) || !isValidObjectId(workspaceId)) return null;
  const membership = await WorkspaceMember.findOne({ workspace: workspaceId, user: userId })
    .select('role')
    .lean();
  return membership?.role ?? null;
}

async function canUserPerform(userId, workspaceId, action) {
  const role = await getUserRole(userId, workspaceId);
  return roleSatisfiesAction(role, action);
}


async function assertPermission(userId, workspaceId, action) {
  const role = await getUserRole(userId, workspaceId);
  if (!role) {
    throw new AppError('Workspace not found or you do not have access', 404);
  }
  if (!roleSatisfiesAction(role, action)) {
    throw new AppError('You do not have permission to perform this action', 403);
  }
  return role;
}

export const permissionService = {
  WORKSPACE_ROLES,
  getUserRole,
  canUserPerform,
  assertPermission,
  roleSatisfiesAction,
};
