import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { FolderModal } from '../components/FolderModal';
import { RowMenu, RowMenuItem } from '../components/RowMenu';
import { MembersPanel } from '../components/MembersPanel';
import { TeamsPanel } from '../components/TeamsPanel';
import { Button } from '../../../components/Button';
import { EmptyState } from '../../../components/EmptyState';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { useToast } from '../../../components/Toast';
import { useWorkspace } from '../hooks/useWorkspace';
import { useFolders } from '../hooks/useFolders';
import { useMembers } from '../hooks/useMembers';
import { useTeams } from '../hooks/useTeams';
import { workspaceApi } from '../api/workspaceApi';
import { timeAgo } from '../utils/timeAgo';
import { ApiError } from '../api/client';
export function WorkspaceOverviewPage() {
    const { workspaceId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const { showToast } = useToast();
    const currentFolderId = searchParams.get('folder');
    const { workspace, role, loading: workspaceLoading, error: workspaceError } = useWorkspace(workspaceId);
    const { folders, loading: foldersLoading, refresh: refreshFolders } = useFolders(workspaceId);
    const { members, loading: membersLoading } = useMembers(workspaceId);
    const { teams, loading: teamsLoading, refresh: refreshTeams } = useTeams(workspaceId);
    const [folderModal, setFolderModal] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const canManage = role === 'OWNER';
    const canEdit = role === 'OWNER' || role === 'EDITOR';
    const currentFolder = useMemo(() => folders.find((f) => f._id === currentFolderId) ?? null, [folders, currentFolderId]);
    const breadcrumbTrail = useMemo(() => {
        const trail = [];
        let cursor = currentFolder;
        while (cursor) {
            trail.unshift(cursor);
            cursor = folders.find((f) => f._id === cursor.parentFolder) ?? null;
        }
        return trail;
    }, [currentFolder, folders]);
    const visibleFolders = useMemo(() => folders.filter((f) => (f.parentFolder ?? null) === (currentFolderId ?? null)), [folders, currentFolderId]);
    function openFolder(folderId) {
        setSearchParams(folderId ? { folder: folderId } : {});
    }
    async function handleDelete() {
        if (!deleteTarget)
            return;
        setDeleting(true);
        try {
            await workspaceApi.deleteFolder(deleteTarget._id);
            showToast(`"${deleteTarget.name}" deleted`);
            if (currentFolderId === deleteTarget._id) {
                setSearchParams(deleteTarget.parentFolder ? { folder: deleteTarget.parentFolder } : {});
            }
            refreshFolders();
        }
        catch (err) {
            showToast(err instanceof ApiError ? err.message : 'Failed to delete folder', 'error');
        }
        finally {
            setDeleting(false);
            setDeleteTarget(null);
        }
    }
    if (workspaceError) {
        return (<div className="min-h-screen bg-canvas">
        <TopBar />
        <main className="mx-auto max-w-6xl px-6 py-16 text-center">
          <p className="text-sm text-red-600">{workspaceError}</p>
          <Link to="/workspaces" className="mt-3 inline-block text-sm text-accent hover:underline">
            Back to workspaces
          </Link>
        </main>
      </div>);
    }
    return (<div className="min-h-screen bg-canvas">
      <TopBar />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-1 flex items-center gap-1.5 text-sm text-ink-500">
          <Link to="/workspaces" className="hover:text-accent">
            Workspaces
          </Link>
          <ChevronIcon />
          {workspaceLoading ? (<span className="h-4 w-24 animate-pulse rounded bg-canvas"/>) : (<span className="font-medium text-ink-900">{workspace?.name}</span>)}
          {breadcrumbTrail.map((folder) => (<span key={folder._id} className="flex items-center gap-1.5">
              <ChevronIcon />
              <button onClick={() => openFolder(folder._id)} className="font-medium text-ink-900 hover:text-accent">
                {folder.name}
              </button>
            </span>))}
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-ink-900">
            {currentFolder ? currentFolder.name : 'Workspace Overview'}
          </h1>
          <div className="flex gap-2">
            <Link to={`/workspaces/${workspaceId}/sharing`}>
              <Button variant="secondary">
                <ShareIcon /> Invite
              </Button>
            </Link>
            {canEdit && (<Button variant="primary" onClick={() => setFolderModal({ mode: 'create' })}>
                <PlusIcon /> New folder
              </Button>)}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-ink-400">
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium">Last Updated</th>
                    <th className="w-10 px-5 py-3"/>
                  </tr>
                </thead>
                <tbody>
                  {foldersLoading ? ([...Array(4)].map((_, i) => (<tr key={i} className="border-b border-border last:border-0">
                        <td className="px-5 py-4">
                          <div className="h-4 w-40 animate-pulse rounded bg-canvas"/>
                        </td>
                        <td className="px-5 py-4">
                          <div className="h-4 w-20 animate-pulse rounded bg-canvas"/>
                        </td>
                        <td />
                      </tr>))) : visibleFolders.length === 0 ? (<tr>
                      <td colSpan={3} className="px-5 py-10">
                        <EmptyState icon={<FolderIcon />} title={currentFolder ? 'This folder is empty' : 'No folders yet'} description="Create a folder to start organizing this workspace's content." action={canEdit ? (<Button variant="primary" onClick={() => setFolderModal({ mode: 'create' })}>
                                <PlusIcon /> New folder
                              </Button>) : undefined}/>
                      </td>
                    </tr>) : (visibleFolders.map((folder) => (<tr key={folder._id} className="border-b border-border last:border-0 hover:bg-canvas/60">
                        <td className="px-5 py-3">
                          <button onClick={() => openFolder(folder._id)} className="flex items-center gap-2.5 text-ink-900 hover:text-accent">
                            <FolderIcon className="h-4 w-4 text-accent"/>
                            <span className="font-medium">{folder.name}</span>
                          </button>
                        </td>
                        <td className="px-5 py-3 text-ink-500">{timeAgo(folder.updatedAt)}</td>
                        <td className="px-5 py-3 text-right">
                          {canEdit && (<RowMenu>
                              {(close) => (<>
                                  <RowMenuItem onClick={() => {
                        setFolderModal({ mode: 'rename', folder });
                        close();
                    }}>
                                    Rename
                                  </RowMenuItem>
                                  <RowMenuItem danger onClick={() => {
                        setDeleteTarget(folder);
                        close();
                    }}>
                                    Delete
                                  </RowMenuItem>
                                </>)}
                            </RowMenu>)}
                        </td>
                      </tr>)))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <MembersPanel workspaceId={workspaceId} members={members} loading={membersLoading}/>
            <TeamsPanel workspaceId={workspaceId} teams={teams} loading={teamsLoading} canManage={canManage} onChanged={refreshTeams}/>
          </div>
        </div>
      </main>

      {folderModal && workspaceId && (<FolderModal open onClose={() => setFolderModal(null)} onSaved={refreshFolders} workspaceId={workspaceId} parentFolderId={currentFolderId} folder={folderModal.folder}/>)}

      <ConfirmDialog open={Boolean(deleteTarget)} title="Delete folder?" description={`"${deleteTarget?.name}" and everything inside it will be permanently deleted. This can't be undone.`} confirmLabel="Delete folder" busy={deleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)}/>
    </div>);
}
function ChevronIcon() {
    return (<svg className="h-3.5 w-3.5 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
    </svg>);
}
function PlusIcon() {
    return (<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
    </svg>);
}
function ShareIcon() {
    return (<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342a4 4 0 100-2.684m0 2.684a4 4 0 110-2.684m0 2.684l6.632 3.658m-6.632-6.342l6.632-3.658m0 0a4 4 0 105.367-5.367 4 4 0 00-5.367 5.367zm0 9.316a4 4 0 105.367 5.367 4 4 0 00-5.367-5.367z"/>
    </svg>);
}
function FolderIcon({ className = 'h-6 w-6' }) {
    return (<svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
    </svg>);
}
