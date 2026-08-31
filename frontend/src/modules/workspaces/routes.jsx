import { Route } from 'react-router-dom';
import { WorkspaceListPage } from './pages/WorkspaceListPage';
import { WorkspaceOverviewPage } from './pages/WorkspaceOverviewPage';
import { WorkspaceSharingPage } from './pages/WorkspaceSharingPage';
export const workspaceRoutes = (<>
    <Route path="/workspaces" element={<WorkspaceListPage />}/>
    <Route path="/workspaces/:workspaceId" element={<WorkspaceOverviewPage />}/>
    <Route path="/workspaces/:workspaceId/sharing" element={<WorkspaceSharingPage />}/>
  </>);
