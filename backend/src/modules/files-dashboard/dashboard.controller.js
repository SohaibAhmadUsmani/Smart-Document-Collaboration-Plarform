import * as dashboardService from './dashboard.service.js';

function getUserId(req) {
  return req.user?.id || req.user?._id || 'anonymous-user';
}

export async function getDashboardHandler(req, res, next) {
  try {
    const userId = getUserId(req);
    const { workspaceId } = req.query;
    const data = await dashboardService.getDashboardOverview(userId, workspaceId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}