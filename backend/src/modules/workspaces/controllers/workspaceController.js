import { workspaceService } from '../services/workspaceService.js';
import { validateWorkspaceInput } from '../validators/workspaceValidators.js';

async function create(req, res, next) {
  try {
    const input = validateWorkspaceInput(req.body);
    const workspace = await workspaceService.createWorkspace({
      ...input,
      ownerId: req.user.id,
    });
    res.status(201).json({ workspace });
  } catch (error) {
    next(error);
  }
}

async function listMine(req, res, next) {
  try {
    const workspaces = await workspaceService.listUserWorkspaces(req.user.id);
    res.json({ workspaces });
  } catch (error) {
    next(error);
  }
}

async function getOne(req, res, next) {
  try {
    const workspace = await workspaceService.getWorkspaceById(req.params.id);
    res.json({ workspace, role: req.workspaceRole });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    // Mass-assignment guard: only name/description are ever accepted here,
    // regardless of what else is in the request body (e.g. owner, sharing).
    const input = validateWorkspaceInput(req.body, { partial: true });
    const workspace = await workspaceService.updateWorkspace(req.params.id, input);
    res.json({ workspace });
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    await workspaceService.deleteWorkspace(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export const workspaceController = { create, listMine, getOne, update, remove };
