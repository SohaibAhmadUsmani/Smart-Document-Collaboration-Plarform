import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { CreateWorkspaceModal } from '../components/createWorkspaceModal';
import { Button } from '../../../components/Button';
import { Badge } from '../../../components/Badge';
import { EmptyState } from '../../../components/EmptyState';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { ROLE_LABELS } from '../types';
function WorkspaceCardSkeleton() {
    return (<div className="animate-pulse rounded-xl border border-border bg-surface p-5">
      <div className="h-4 w-2/3 rounded bg-canvas"/>
      <div className="mt-3 h-3 w-full rounded bg-canvas"/>
      <div className="mt-2 h-3 w-1/2 rounded bg-canvas"/>
    </div>);
}
export function WorkspaceListPage() {
    const { workspaces, loading, error, refresh } = useWorkspaces();
    const [createOpen, setCreateOpen] = useState(false);
    return (<div className="min-h-screen bg-canvas">
      <TopBar />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Workspaces</p>
            <h1 className="mt-1 text-2xl font-semibold text-ink-900">Your workspaces</h1>
          </div>
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <PlusIcon /> New workspace
          </Button>
        </div>

        {error && (<div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}{' '}
            <button className="font-medium underline" onClick={refresh}>
              Try again
            </button>
          </div>)}

        {loading ? (<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (<WorkspaceCardSkeleton key={i}/>))}
          </div>) : workspaces.length === 0 && !error ? (<EmptyState icon={<FolderStackIcon />} title="No workspaces yet" description="Create your first workspace to start organizing folders and collaborating with your team." action={<Button variant="primary" onClick={() => setCreateOpen(true)}>
                <PlusIcon /> Create workspace
              </Button>}/>) : (<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((workspace) => (<Link key={workspace._id} to={`/workspaces/${workspace._id}`} className="group rounded-xl border border-border bg-surface p-5 shadow-card transition-shadow hover:shadow-popover">
                <div className="flex items-start justify-between">
                  <h2 className="text-sm font-semibold text-ink-900 group-hover:text-accent">
                    {workspace.name}
                  </h2>
                  {workspace.myRole && <Badge tone="blue">{ROLE_LABELS[workspace.myRole]}</Badge>}
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-ink-500">
                  {workspace.description || 'No description yet.'}
                </p>
              </Link>))}
          </div>)}
      </main>

      <CreateWorkspaceModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={refresh}/>
    </div>);
}
function PlusIcon() {
    return (<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
    </svg>);
}
function FolderStackIcon() {
    return (<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
    </svg>);
}
