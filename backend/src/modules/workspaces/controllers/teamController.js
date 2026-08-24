import { teamService } from '../services/teamService.js';
import { validateObjectId, validateTeamInput } from '../validators/workspaceValidators.js';

async function create(req, res, next) {
  try {
    const input = validateTeamInput(req.body);
    const team = await teamService.createTeam(req.params.workspaceId, {
      ...input,
      createdBy: req.user.id,
    });
    res.status(201).json({ team });
  } catch (error) {
    next(error);
  }
}

async function list(req, res, next) {
  try {
    const teams = await teamService.listTeams(req.params.workspaceId);
    res.json({ teams });
  } catch (error) {
    next(error);
  }
}

async function addMember(req, res, next) {
  try {
    const userId = validateObjectId(req.body.userId, 'userId');
    const team = await teamService.addTeamMember(req.params.teamId, userId);
    res.status(201).json({ team });
  } catch (error) {
    next(error);
  }
}

async function removeMember(req, res, next) {
  try {
    const team = await teamService.removeTeamMember(req.params.teamId, req.params.userId);
    res.json({ team });
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    await teamService.deleteTeam(req.params.teamId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export const teamController = { create, list, addMember, removeMember, remove };
