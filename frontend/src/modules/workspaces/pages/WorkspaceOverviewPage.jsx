import { useMemo, useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { FilterSortBar } from '../components/FilterSortBar';
import { FolderModal } from '../components/FolderModal';
import { RowMenu, RowMenuItem } from '../components/RowMenu';
import { MembersPanel } from '../components/MembersPanel';
import { TeamsPanel } from '../components/TeamsPanel';
import { Button } from '../../../components/Button';
import { EmptyState } from '../../../components/EmptyState';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { useToast } from '../../../components/Toast';
import { SmartBackButton } from '../../../components/SmartBackButton.jsx';
import { useWorkspace } from '../hooks/useWorkspace';
import { useFolders } from '../hooks/useFolders';
import { useMembers } from '../hooks/useMembers';
import { useTeams } from '../hooks/useTeams';
import { workspaceApi } from '../api/workspaceApi';
import { apiListDocuments } from '../../editor/services/documentApi';
import { timeAgo } from '../utils/timeAgo';
import { ApiError } from '../api/client';

/**
 * WorkspaceOverviewPage Component
 *
 * English:
 * Workspace dashboard view providing folder hierarchies, breadcrumb navigation, member & team
 * management panels, folder creation/renaming/deletion, document creation links, and smart back navigation.
 * Inside any subfolder, clicking the workspace root name returns users directly to the root folder.
 *
 * Roman Urdu:
 * Workspace ka main overview page jo folders ki hierarchy, clickable breadcrumbs, members aur teams panels,
 * folders manage karne ke tools, aur document creation support karta hai. Subfolder mein mojood hotay waqt
 * workspace root name par click karne se user foran root folder par wapis pohnch jata hai.
 *
 * @returns {JSX.Element}
 */
export function WorkspaceOverviewPage() {
  const { workspaceId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const currentFolderId = searchParams.get('folder');

  const { workspace, role, loading: workspaceLoading, error: workspaceError } = useWorkspace(workspaceId);
  const { folders, loading: foldersLoading, refresh: refreshFolders } = useFolders(workspaceId);
  const { members, loading: membersLoading } = useMembers(workspaceId);
  const { teams, loading: teamsLoading, refresh: refreshTeams } = useTeams(workspaceId);

  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [folderModal, setFolderModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [view, setView] = useState('list');
  const [filterQuery, setFilterQuery] = useState('');
  const [sortKey, setSortKey] = useState('name-asc');

  const canManage = role === 'OWNER';
  const canEdit = role === 'OWNER' || role === 'EDITOR';

  // Fetch documents for the active workspace and folder
  useEffect(() => {
    let isMounted = true;
    async function loadDocuments() {
      if (!workspaceId) return;
      setDocsLoading(true);
      try {
        const query = { workspaceId };
        if (currentFolderId) query.folderId = currentFolderId;
        const res = await apiListDocuments(query);
        const docList = Array.isArray(res) ? res : (res?.data || res?.documents || []);
        if (isMounted) setDocuments(docList);
      } catch (err) {
        console.warn('Failed to load documents:', err);
      } finally {
        if (isMounted) setDocsLoading(false);
      }
    }
    loadDocuments();
    return () => {
      isMounted = false;
    };
  }, [workspaceId, currentFolderId]);

  const currentFolder = useMemo(
    () => folders.find((f) => f._id === currentFolderId) ?? null,
    [folders, currentFolderId]
  );

  const breadcrumbTrail = useMemo(() => {
    const trail = [];
    let cursor = currentFolder;
    while (cursor) {
      trail.unshift(cursor);
      cursor = folders.find((f) => f._id === cursor.parentFolder) ?? null;
    }
    return trail;
  }, [currentFolder, folders]);

  const visibleFolders = useMemo(() => {
    const inCurrentFolder = folders.filter((f) => (f.parentFolder ?? null) === (currentFolderId ?? null));
    const filtered = filterQuery.trim()
      ? inCurrentFolder.filter((f) => f.name.toLowerCase().includes(filterQuery.trim().toLowerCase()))
      : inCurrentFolder;
    const sorted = [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'updated-desc':
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        case 'updated-asc':
          return new Date(a.updatedAt) - new Date(b.updatedAt);
        case 'name-asc':
        default:
          return a.name.localeCompare(b.name);
      }
    });
    return sorted;
  }, [folders, currentFolderId, filterQuery, sortKey]);

  const visibleDocuments = useMemo(() => {
    const inCurrentScope = documents.filter(
      (d) => (d.folderId ?? null) === (currentFolderId ?? null) && !d.isArchived
    );
    const filtered = filterQuery.trim()
      ? inCurrentScope.filter((d) => (d.title || 'Untitled Document').toLowerCase().includes(filterQuery.trim().toLowerCase()))
      : inCurrentScope;
    const sorted = [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'name-desc':
          return (b.title || 'Untitled Document').localeCompare(a.title || 'Untitled Document');
        case 'updated-desc':
          return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
        case 'updated-asc':
          return new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0);
        case 'name-asc':
        default:
          return (a.title || 'Untitled Document').localeCompare(b.title || 'Untitled Document');
      }
    });
    return sorted;
  }, [documents, currentFolderId, filterQuery, sortKey]);

  const lastUpdatedLabel = useMemo(() => {
    if (folders.length === 0 && documents.length === 0) return 'No updates yet';
    const dates = [
      ...folders.map((f) => new Date(f.updatedAt).getTime()),
      ...documents.map((d) => new Date(d.updatedAt || 0).getTime()),
    ].filter((t) => !isNaN(t) && t > 0);
    if (dates.length === 0) return 'No updates yet';
    const latestTime = Math.max(...dates);
    return `Last updated: ${timeAgo(new Date(latestTime))}`;
  }, [folders, documents]);

  /**
   * Set active folder in query params or return to root if folderId is null
   * English: Updates URL folder search param or clears it to return to root.
   * Roman Urdu: URL search parameter mein folder update karta hai ya root par wapis lata hai.
   */
  function openFolder(folderId) {
    setSearchParams(folderId ? { folder: folderId } : {});
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await workspaceApi.deleteFolder(deleteTarget._id);
      showToast(`"${deleteTarget.name}" deleted`);
      if (currentFolderId === deleteTarget._id) {
        setSearchParams(deleteTarget.parentFolder ? { folder: deleteTarget.parentFolder } : {});
      }
      refreshFolders();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to delete folder', 'error');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  if (workspaceError) {
    return (
      <div className="min-h-screen bg-canvas">
        <TopBar />
        <main className="mx-auto max-w-6xl px-4 sm:px-6 py-16 text-center">
          <p className="text-sm text-red-600">{workspaceError}</p>
          <Link to="/workspaces" className="mt-3 inline-block text-sm text-accent hover:underline">
            Back to workspaces
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <TopBar />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
        {/* Breadcrumbs Navigation with Clickable Root */}
        <div className="mb-2 flex flex-wrap items-center gap-1.5 text-sm text-ink-500">
          <Link to="/workspaces" className="hover:text-accent transition-colors">
            Workspaces
          </Link>
          <ChevronIcon />
          {workspaceLoading ? (
            <span className="h-4 w-24 animate-pulse rounded bg-canvas" />
          ) : currentFolderId ? (
            <button
              type="button"
              onClick={() => openFolder(null)}
              className="font-medium text-ink-900 hover:text-accent transition-colors cursor-pointer"
              title="Return to workspace root folder"
            >
              {workspace?.name}
            </button>
          ) : (
            <span className="font-medium text-ink-900">{workspace?.name}</span>
          )}
          {breadcrumbTrail.map((folder, index) => {
            const isLast = index === breadcrumbTrail.length - 1;
            return (
              <span key={folder._id} className="flex items-center gap-1.5">
                <ChevronIcon />
                {isLast ? (
                  <span className="font-medium text-ink-900">{folder.name}</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => openFolder(folder._id)}
                    className="font-medium text-ink-900 hover:text-accent transition-colors cursor-pointer"
                  >
                    {folder.name}
                  </button>
                )}
              </span>
            );
          })}
        </div>

        {/* Page Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <SmartBackButton fallbackPath="/workspaces" />
            <h1 className="text-2xl font-semibold text-ink-900">
              {currentFolder ? currentFolder.name : 'Workspace Overview'}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/workspaces/${workspaceId}/sharing`}>
              <Button variant="secondary">
                <ShareIcon /> Invite
              </Button>
            </Link>
            {canEdit && (
              <Button variant="primary" onClick={() => setFolderModal({ mode: 'create' })}>
                <PlusIcon /> New folder
              </Button>
            )}
            {canEdit && (
              <Link
                to={`/editor?workspaceId=${workspaceId}${currentFolderId ? `&folderId=${currentFolderId}` : ''}`}
              >
                <Button variant="dark">
                  <PlusIcon /> New document
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Main Content: Folders & Sidebar Panels */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <FilterSortBar
              view={view}
              onViewChange={setView}
              query={filterQuery}
              onQueryChange={setFilterQuery}
              sortKey={sortKey}
              onSortKeyChange={setSortKey}
              lastUpdatedLabel={lastUpdatedLabel}
            />

            {view === 'grid' ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {foldersLoading ? (
                  [...Array(4)].map((_, i) => (
                    <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-surface" />
                  ))
                ) : visibleFolders.length === 0 ? (
                  <div className="sm:col-span-2">
                    <div className="rounded-xl border border-border bg-surface px-5 py-10 shadow-card">
                      <EmptyState
                        icon={<FolderIcon />}
                        title={
                          currentFolder
                            ? filterQuery
                              ? 'No folders match'
                              : 'This folder is empty'
                            : filterQuery
                            ? 'No folders match'
                            : 'No folders yet'
                        }
                        description={
                          filterQuery
                            ? 'Try a different filter term.'
                            : "Create a folder to start organizing this workspace's content."
                        }
                        action={
                          !filterQuery && canEdit ? (
                            <Button variant="primary" onClick={() => setFolderModal({ mode: 'create' })}>
                              <PlusIcon /> New folder
                            </Button>
                          ) : undefined
                        }
                      />
                    </div>
                  </div>
                ) : (
                  visibleFolders.map((folder) => (
                    <div
                      key={folder._id}
                      className="flex items-center justify-between rounded-xl border border-border bg-surface p-4 shadow-card hover:shadow-popover transition-shadow"
                    >
                      <button
                        onClick={() => openFolder(folder._id)}
                        className="flex min-w-0 items-center gap-2.5 text-left text-ink-900 hover:text-accent cursor-pointer"
                      >
                        <FolderIcon className="h-5 w-5 shrink-0 text-accent" />
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{folder.name}</span>
                          <span className="block text-xs text-ink-400">{timeAgo(folder.updatedAt)}</span>
                        </span>
                      </button>
                      {canEdit && (
                        <RowMenu>
                          {(close) => (
                            <>
                              <RowMenuItem
                                onClick={() => {
                                  setFolderModal({ mode: 'rename', folder });
                                  close();
                                }}
                              >
                                Rename
                              </RowMenuItem>
                              <RowMenuItem
                                danger
                                onClick={() => {
                                  setDeleteTarget(folder);
                                  close();
                                }}
                              >
                                Delete
                              </RowMenuItem>
                            </>
                          )}
                        </RowMenu>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wide text-ink-400">
                      <th className="px-5 py-3 font-medium">Name</th>
                      <th className="px-5 py-3 font-medium">Last Updated</th>
                      <th className="w-10 px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {foldersLoading ? (
                      [...Array(4)].map((_, i) => (
                        <tr key={i} className="border-b border-border last:border-0">
                          <td className="px-5 py-4">
                            <div className="h-4 w-40 animate-pulse rounded bg-canvas" />
                          </td>
                          <td className="px-5 py-4">
                            <div className="h-4 w-20 animate-pulse rounded bg-canvas" />
                          </td>
                          <td />
                        </tr>
                      ))
                    ) : visibleFolders.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-5 py-10">
                          <EmptyState
                            icon={<FolderIcon />}
                            title={
                              filterQuery
                                ? 'No folders match'
                                : currentFolder
                                ? 'This folder is empty'
                                : 'No folders yet'
                            }
                            description={
                              filterQuery
                                ? 'Try a different filter term.'
                                : "Create a folder to start organizing this workspace's content."
                            }
                            action={
                              !filterQuery && canEdit ? (
                                <Button variant="primary" onClick={() => setFolderModal({ mode: 'create' })}>
                                  <PlusIcon /> New folder
                                </Button>
                              ) : undefined
                            }
                          />
                        </td>
                      </tr>
                    ) : (
                      visibleFolders.map((folder) => (
                        <tr
                          key={folder._id}
                          className="border-b border-border last:border-0 hover:bg-canvas/60 transition-colors"
                        >
                          <td className="px-5 py-3">
                            <button
                              onClick={() => openFolder(folder._id)}
                              className="flex items-center gap-2.5 text-ink-900 hover:text-accent cursor-pointer"
                            >
                              <FolderIcon className="h-4 w-4 text-accent" />
                              <span className="font-medium">{folder.name}</span>
                            </button>
                          </td>
                          <td className="px-5 py-3 text-ink-500">{timeAgo(folder.updatedAt)}</td>
                          <td className="px-5 py-3 text-right">
                            {canEdit && (
                              <RowMenu>
                                {(close) => (
                                  <>
                                    <RowMenuItem
                                      onClick={() => {
                                        setFolderModal({ mode: 'rename', folder });
                                        close();
                                      }}
                                    >
                                      Rename
                                    </RowMenuItem>
                                    <RowMenuItem
                                      danger
                                      onClick={() => {
                                        setDeleteTarget(folder);
                                        close();
                                      }}
                                    >
                                      Delete
                                    </RowMenuItem>
                                  </>
                                )}
                              </RowMenu>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Documents Section */}
            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-500">
                  Documents ({visibleDocuments.length})
                </h2>
                {canEdit && (
                  <Link
                    to={`/editor?workspaceId=${workspaceId}${currentFolderId ? `&folderId=${currentFolderId}` : ''}`}
                    className="text-xs font-medium text-accent hover:underline flex items-center gap-1"
                  >
                    <PlusIcon /> New document
                  </Link>
                )}
              </div>

              {docsLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-14 animate-pulse rounded-xl border border-border bg-surface" />
                  ))}
                </div>
              ) : visibleDocuments.length === 0 ? (
                <div className="rounded-xl border border-border bg-surface px-5 py-8 text-center">
                  <DocumentIcon className="mx-auto h-8 w-8 text-ink-300 mb-2" />
                  <p className="text-sm font-medium text-ink-700">No documents yet in this folder</p>
                  <p className="text-xs text-ink-400 mt-1 mb-4">Create a new document to start collaborating.</p>
                  {canEdit && (
                    <Link
                      to={`/editor?workspaceId=${workspaceId}${currentFolderId ? `&folderId=${currentFolderId}` : ''}`}
                    >
                      <Button variant="primary" size="sm">
                        <PlusIcon /> Create document
                      </Button>
                    </Link>
                  )}
                </div>
              ) : view === 'grid' ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {visibleDocuments.map((doc) => (
                    <Link
                      key={doc._id || doc.id}
                      to={`/editor/${doc._id || doc.id}`}
                      className="flex items-center justify-between rounded-xl border border-border bg-surface p-4 shadow-card hover:shadow-popover hover:border-accent/40 transition-all group"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="text-xl shrink-0">{doc.icon || '📄'}</span>
                        <div className="min-w-0">
                          <span className="block truncate font-medium text-ink-900 group-hover:text-accent transition-colors">
                            {doc.title || 'Untitled Document'}
                          </span>
                          <span className="block text-xs text-ink-400">
                            {timeAgo(doc.updatedAt)}
                          </span>
                        </div>
                      </div>
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="flex gap-1 shrink-0">
                          {doc.tags.slice(0, 2).map((t) => (
                            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-canvas text-ink-500 font-mono">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs uppercase tracking-wide text-ink-400">
                        <th className="px-5 py-3 font-medium">Title</th>
                        <th className="px-5 py-3 font-medium">Last Modified</th>
                        <th className="px-5 py-3 font-medium text-right">Tags</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleDocuments.map((doc) => (
                        <tr
                          key={doc._id || doc.id}
                          className="border-b border-border last:border-0 hover:bg-canvas/60 transition-colors group"
                        >
                          <td className="px-5 py-3">
                            <Link
                              to={`/editor/${doc._id || doc.id}`}
                              className="flex items-center gap-2.5 text-ink-900 group-hover:text-accent font-medium"
                            >
                              <span className="text-base shrink-0">{doc.icon || '📄'}</span>
                              <span className="truncate">{doc.title || 'Untitled Document'}</span>
                            </Link>
                          </td>
                          <td className="px-5 py-3 text-ink-500 text-xs">
                            {timeAgo(doc.updatedAt)}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {doc.tags && doc.tags.slice(0, 3).map((tag) => (
                                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-canvas text-ink-500 font-mono">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Members and Teams Sidebar Panels */}
          <div className="space-y-6">
            <MembersPanel workspaceId={workspaceId} members={members} loading={membersLoading} />
            <TeamsPanel
              workspaceId={workspaceId}
              teams={teams}
              loading={teamsLoading}
              canManage={canManage}
              onChanged={refreshTeams}
            />
          </div>
        </div>
      </main>

      {folderModal && workspaceId && (
        <FolderModal
          open
          onClose={() => setFolderModal(null)}
          onSaved={refreshFolders}
          workspaceId={workspaceId}
          parentFolderId={currentFolderId}
          folder={folderModal.folder}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete folder?"
        description={`"${deleteTarget?.name}" and everything inside it will be permanently deleted. This can't be undone.`}
        confirmLabel="Delete folder"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg className="h-3.5 w-3.5 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8.684 13.342a4 4 0 100-2.684m0 2.684a4 4 0 110-2.684m0 2.684l6.632 3.658m-6.632-6.342l6.632-3.658m0 0a4 4 0 105.367-5.367 4 4 0 00-5.367 5.367zm0 9.316a4 4 0 105.367 5.367 4 4 0 00-5.367-5.367z"
      />
    </svg>
  );
}

function FolderIcon({ className = 'h-6 w-6' }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  );
}

function DocumentIcon({ className = 'h-6 w-6' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

export default WorkspaceOverviewPage;