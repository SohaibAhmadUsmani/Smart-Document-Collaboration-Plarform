import { Team } from '../models/Team.js';
import { AppError } from '../utils/AppError.js';

async function createTeam(workspaceId, { name, createdBy }) {
  const existing = await Team.findOne({ workspace: workspaceId, name });
  if (existing) {
    throw new AppError('A team with this name already exists in the workspace', 400);
  }

  return Team.create({
    workspace: workspaceId,
    name,
    createdBy,
    members: [{ user: createdBy }],
  });
}

async function listTeams(workspaceId) {
  return Team.find({ workspace: workspaceId }).sort({ name: 1 }).lean();
}

async function getTeamById(teamId) {
  const team = await Team.findById(teamId).lean();
  if (!team) {
    throw new AppError('Team not found', 404);
  }
  return team;
}

async function addTeamMember(teamId, userId) {
  const team = await Team.findById(teamId);
  if (!team) {
    throw new AppError('Team not found', 404);
  }
  const alreadyMember = team.members.some((member) => String(member.user) === String(userId));
  if (alreadyMember) {
    throw new AppError('User is already on this team', 400);
  }
  team.members.push({ user: userId });
  await team.save();
  return team;
}

async function removeTeamMember(teamId, userId) {
  const team = await Team.findById(teamId);
  if (!team) {
    throw new AppError('Team not found', 404);
  }
  team.members = team.members.filter((member) => String(member.user) !== String(userId));
  await team.save();
  return team;
}

async function deleteTeam(teamId) {
  const result = await Team.findByIdAndDelete(teamId);
  if (!result) {
    throw new AppError('Team not found', 404);
  }
}

export const teamService = {
  createTeam,
  listTeams,
  getTeamById,
  addTeamMember,
  removeTeamMember,
  deleteTeam,
};
