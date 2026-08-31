import { Link, useParams } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { InviteForm } from '../components/InviteForm';
import { GeneralAccessCard } from '../components/GeneralAccessCard';
import { ManageAccessPanel } from '../components/ManageAccessPanel';
import { DangerZoneCard } from '../components/DangerZoneCard';
import { useWorkspace } from '../hooks/useWorkspace';
import { useMembers } from '../hooks/useMembers';
import { useSharing } from '../hooks/useSharing';
export function WorkspaceSharingPage() {
    const { workspaceId } = useParams();
    const { workspace, role, loading: workspaceLoading, error: workspaceError } = useWorkspace(workspaceId);
    const { members, loading: membersLoading, refresh: refreshMembers } = useMembers(workspaceId);
    const { sharing, setSharing, loading: sharingLoading } = useSharing(workspaceId);
    const canManage = role === 'OWNER';
    if (workspaceError) {
        return (<div className="min-h-screen bg-canvas">
        <TopBar />
        <main className="mx-auto max-w-3xl px-6 py-16 text-center">
          <p className="text-sm text-red-600">{workspaceError}</p>
          <Link to="/workspaces" className="mt-3 inline-block text-sm text-accent hover:underline">
            Back to workspaces
          </Link>
        </main>
      </div>);
    }
    return (<div className="min-h-screen bg-canvas">
      <TopBar />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-400">
          <ShieldIcon /> Access Management
        </div>
        <h1 className="text-2xl font-semibold text-ink-900">Sharing &amp; Permissions</h1>
        {workspaceLoading ? (<div className="mt-2 h-4 w-56 animate-pulse rounded bg-canvas"/>) : (<p className="mt-1 text-sm text-ink-500">{workspace?.name} — Workspace access</p>)}

        {!canManage && !workspaceLoading && (<p className="mt-4 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-ink-500">
            Only workspace owners can change access. You can view current members and settings below.
          </p>)}

        <div className="mt-6 space-y-6">
          {canManage && <InviteForm workspaceId={workspaceId} onInvited={refreshMembers}/>}

          {sharing && !sharingLoading && (<GeneralAccessCard workspaceId={workspaceId} sharing={sharing} canManage={canManage} onChanged={setSharing}/>)}

          <ManageAccessPanel workspaceId={workspaceId} members={members} loading={membersLoading} canManage={canManage} onChanged={refreshMembers}/>

          {canManage && workspace && (<DangerZoneCard workspaceId={workspace._id} workspaceName={workspace.name}/>)}
        </div>

        <div className="mt-6 flex justify-end">
          <Link to={`/workspaces/${workspaceId}`}>
            <button className="rounded-lg bg-ink-900 px-4 py-2 text-sm font-medium text-white hover:bg-black">
              Done
            </button>
          </Link>
        </div>
      </main>
    </div>);
}
function ShieldIcon() {
    return (<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
    </svg>);
}
