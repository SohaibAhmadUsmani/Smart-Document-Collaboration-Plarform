import { memberService } from '../services/memberService.js';
import { validateObjectId, validateRole } from '../validators/workspaceValidators.js';
import { AppError } from '../utils/AppError.js';

async function list(req, res, next) {
  try {
    const members = await memberService.listMembers(req.params.workspaceId);
    res.json({ members });
  } catch (error) {
    next(error);
  }
}

async function add(req, res, next) {
  try {
    const userId = validateObjectId(req.body.userId, 'userId');
    const role = validateRole(req.body.role);
    const membership = await memberService.addMember(req.params.workspaceId, {
      userId,
      role,
      invitedBy: req.user.id,
    });
    res.status(201).json({ member: membership });
  } catch (error) {
    next(error);
  }
}

async function updateRole(req, res, next) {
  try {
    const role = validateRole(req.body.role);
    // Only OWNERs reach this point (enforced by requireWorkspaceRole('manage')),
    // but a member still shouldn't be able to demote themselves into a
    // broken state by accident via a stray request.
    if (req.params.userId === req.user.id && role !== 'OWNER') {
      throw new AppError('Use another owner to change your own role', 400);
    }
    const membership = await memberService.changeRole(req.params.workspaceId, req.params.userId, role);
    res.json({ member: membership });
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    await memberService.removeMember(req.params.workspaceId, req.params.userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export const memberController = { list, add, updateRole, remove };
