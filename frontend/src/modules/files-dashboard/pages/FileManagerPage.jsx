import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Upload,
  FileText,
  Download,
  Edit2,
  Trash2,
  MoreVertical,
  FolderInput,
  Copy,
  FolderOpen,
  Folder,
  FolderPlus,
  ChevronRight,
  Home,
  Users,
  X,
  Star,
} from 'lucide-react';
import {
  listFiles,
  uploadFile,
  renameFile,
  deleteFile,
  moveFile,
  duplicateFile,
  getDownloadUrl,
} from '../services/filesDashboardApi.js';
import { workspaceApi } from '../../workspaces/api/workspaceApi.js';
import { SmartBackButton } from '../../../components/SmartBackButton.jsx';
import { ConfirmDialog } from '../../../components/ConfirmDialog.jsx';

const DEFAULT_WORKSPACE_ID = 'test-workspace-1';

/**
 * Format bytes count into clean human-readable file size format.
 * English: Converts raw numeric bytes to B, KB, or MB string representation.
 * Roman Urdu: Numeric bytes ko readable format (B, KB, MB) mein convert karta hai.
 *
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
function formatSize(bytes) {
  if (!bytes && bytes !== 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Calculates human-readable relative time difference.
 * English: Calculates elapsed time since date and outputs compact duration.
 * Roman Urdu: Diye gaye waqt aur mojuda waqt ka farq hisab karke "m ago", "h ago" wagera return karta hai.
 *
 * @param {string} dateStr - ISO date string
 * @returns {string} Relative time label
 */
function timeAgo(dateStr) {
  if (!dateStr) return 'unknown';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/**
 * FileManagerPage Component
 *
 * English:
 * Comprehensive file management view supporting file uploading, downloading, renaming,
 * moving across folders, duplicating, and deleting with full dark mode support, safe navigation,
 * and responsive layout.
 *
 * Roman Urdu:
 * Mukammal file management view jo file upload, download, rename, folder move, copy/duplicate
 * aur delete operations support karta hai complete dark mode aur responsive layout ke sath.
 *
 * @param {Object} props
 * @param {string} [props.workspaceId='test-workspace-1'] - Active workspace identifier
 * @returns {JSX.Element}
 */
export default function FileManagerPage({ workspaceId = DEFAULT_WORKSPACE_ID }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filterQuery = searchParams.get('filter');

  const [activeWorkspaceId, setActiveWorkspaceId] = useState(() => {
    return searchParams.get('workspaceId') || workspaceId;
  });
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [movingId, setMovingId] = useState(null);
  const [moveValue, setMoveValue] = useState('');
  const [copyingId, setCopyingId] = useState(null);
  const [copyValue, setCopyValue] = useState('');
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const fileInputRef = useRef(null);
  const menuContainerRef = useRef(null);

  const [fileToDelete, setFileToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Load workspaces and folders
  useEffect(() => {
    let isMounted = true;
    async function initWorkspacesAndFolders() {
      try {
        let wsId = activeWorkspaceId;
        if (!wsId || wsId === DEFAULT_WORKSPACE_ID) {
          const wsRes = await workspaceApi.list();
          const list = wsRes?.data || [];
          if (list.length > 0) {
            wsId = list[0]._id;
            if (isMounted) setActiveWorkspaceId(wsId);
          }
        }
        if (wsId && wsId !== DEFAULT_WORKSPACE_ID) {
          const fRes = await workspaceApi.listFolders(wsId);
          const fList = fRes?.data || [];
          if (isMounted) setFolders(fList);
        }
      } catch (err) {
        console.warn('Failed to load folders:', err);
      }
    }
    initWorkspacesAndFolders();
    return () => {
      isMounted = false;
    };
  }, [activeWorkspaceId]);

  // Close open action menu on outside click
  useEffect(() => {
    function handleOutsideClick(e) {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    }
    if (openMenuId) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [openMenuId]);

  /**
   * Loads files for the active workspace and folder with cancellation support.
   */
  async function loadFiles(folderId) {
    setLoading(true);
    const res = await listFiles(activeWorkspaceId, folderId || undefined);
    if (res.ok) {
      const rows = res.data?.data || [];
      const filtered = folderId
        ? rows.filter((f) => f.folderId === folderId)
        : rows.filter((f) => !f.folderId);
      setFiles(filtered);
      setError(null);
    } else {
      setError(res.error || 'Failed to load files');
    }
    setLoading(false);
  }

  useEffect(() => {
    let isCurrent = true;
    async function fetchFiles() {
      setLoading(true);
      const res = await listFiles(activeWorkspaceId, currentFolderId || undefined);
      if (!isCurrent) return;
      if (res.ok) {
        const rows = res.data?.data || [];
        const filtered = currentFolderId
          ? rows.filter((f) => f.folderId === currentFolderId)
          : rows.filter((f) => !f.folderId);
        setFiles(filtered);
        setError(null);
      } else {
        setError(res.error || 'Failed to load files');
      }
      setLoading(false);
    }
    fetchFiles();
    return () => {
      isCurrent = false;
    };
  }, [activeWorkspaceId, currentFolderId]);

  function backToRoot() {
    setCurrentFolderId(null);
  }

  async function handleFileSelected(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploading(true);
    const res = await uploadFile({ file, workspaceId, folderId: currentFolderId });
    setUploading(false);
    if (res.ok) {
      await loadFiles(currentFolderId);
    } else {
      setError(res.error || 'Upload failed');
    }
    e.target.value = '';
  }

  function promptDelete(fileId, fileName) {
    setOpenMenuId(null);
    setFileToDelete({ id: fileId, name: fileName });
  }

  async function handleConfirmDelete() {
    if (!fileToDelete) return;
    setDeleting(true);
    const res = await deleteFile(fileToDelete.id);
    setDeleting(false);
    if (res.ok) {
      setFiles((prev) => prev.filter((f) => f._id !== fileToDelete.id));
      setFileToDelete(null);
    } else {
      setError(res.error || 'Delete failed');
      setFileToDelete(null);
    }
  }

  function startRename(file) {
    setOpenMenuId(null);
    setRenamingId(file._id);
    setRenameValue(file.fileName);
  }

  async function confirmRename(fileId) {
    if (!renameValue.trim()) {
      setRenamingId(null);
      return;
    }
    const res = await renameFile(fileId, renameValue.trim());
    if (res.ok) {
      setFiles((prev) => prev.map((f) => (f._id === fileId ? res.data.data : f)));
    } else {
      setError(res.error || 'Rename failed');
    }
    setRenamingId(null);
  }

  function startMove(file) {
    setOpenMenuId(null);
    setMovingId(file._id);
    setMoveValue('');
  }

  async function confirmMove(fileId) {
    const targetFolderId = moveValue.trim() || null;
    const res = await moveFile(fileId, targetFolderId);
    if (res.ok) {
      const stillVisible = targetFolderId === currentFolderId;
      if (stillVisible) {
        setFiles((prev) => prev.map((f) => (f._id === fileId ? res.data.data : f)));
      } else {
        setFiles((prev) => prev.filter((f) => f._id !== fileId));
      }
    } else {
      setError(res.error || 'Move failed');
    }
    setMovingId(null);
  }

  function cancelMove() {
    setMovingId(null);
    setMoveValue('');
  }

  function startCopy(file) {
    setOpenMenuId(null);
    setCopyingId(file._id);
    setCopyValue('');
  }

  async function confirmCopy(fileId) {
    const targetFolderId = copyValue.trim() || null;
    const res = await duplicateFile(fileId, targetFolderId);
    if (res.ok) {
      if (targetFolderId === currentFolderId) {
        setFiles((prev) => [res.data.data, ...prev]);
      }
      // If copied elsewhere, original stays visible here (correct copy behavior).
    } else {
      setError(res.error || 'Copy failed');
    }
    setCopyingId(null);
  }

  function cancelCopy() {
    setCopyingId(null);
    setCopyValue('');
  }

  // Filter files if filter param is present
  const displayedFiles = filterQuery === 'favorites'
    ? files.filter((f) => f.isFavorite || f.isFavorited)
    : files;

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <SmartBackButton fallbackPath="/dashboard" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">File Manager</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                {currentFolderId ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400">
                    <FolderOpen size={15} /> Viewing folder: {currentFolderId}
                  </span>
                ) : (
                  'Organize your workspace files and folders.'
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/60 transition text-sm font-medium shadow-sm cursor-pointer"
            >
              <Home size={16} />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => navigate('/workspaces')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/60 transition text-sm font-medium shadow-sm cursor-pointer"
            >
              <Users size={16} />
              <span>Workspaces</span>
            </button>
            <button
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm cursor-pointer active:scale-95"
            >
              <Upload size={16} />
              <span>{uploading ? 'Uploading...' : 'Upload File'}</span>
            </button>
          </div>
        </div>

        {/* Hidden Native File Input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg"
          onChange={handleFileSelected}
        />

        {/* Active Filter Pill */}
        {filterQuery && (
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-full text-xs font-medium text-blue-700 dark:text-blue-300">
            <Star size={13} className="fill-blue-600 text-blue-600 dark:fill-blue-400 dark:text-blue-400" />
            <span>Filter: {filterQuery}</span>
            <button
              type="button"
              onClick={() => setSearchParams({})}
              className="hover:text-blue-900 dark:hover:text-white cursor-pointer ml-1"
              title="Clear filter"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Breadcrumb & Folder Navigation */}
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <button
            type="button"
            onClick={backToRoot}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer ${
              !currentFolderId ? 'font-semibold text-slate-900 dark:text-white' : ''
            }`}
          >
            <Home size={15} />
            <span>Root</span>
          </button>
          {(() => {
            const currentFolder = folders.find((f) => f._id === currentFolderId) || null;
            const breadcrumbs = [];
            let cursor = currentFolder;
            while (cursor) {
              breadcrumbs.unshift(cursor);
              cursor = folders.find((f) => f._id === cursor.parentFolder) || null;
            }
            return breadcrumbs.map((bf, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={bf._id}>
                  <ChevronRight size={14} className="text-slate-400 shrink-0" />
                  <button
                    type="button"
                    onClick={() => setCurrentFolderId(bf._id)}
                    className={`px-2 py-1 rounded-md transition hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer ${
                      isLast ? 'font-semibold text-slate-900 dark:text-white' : ''
                    }`}
                  >
                    {bf.name}
                  </button>
                </React.Fragment>
              );
            });
          })()}
        </div>

        {/* Visual Subfolders Grid */}
        {(() => {
          const subfolders = folders.filter((f) => (f.parentFolder ?? null) === (currentFolderId ?? null));
          if (subfolders.length === 0) return null;
          return (
            <div className="mb-6">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                Folders ({subfolders.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {subfolders.map((folder) => (
                  <button
                    key={folder._id}
                    type="button"
                    onClick={() => setCurrentFolderId(folder._id)}
                    className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-blue-500/50 hover:shadow-xs transition text-left cursor-pointer group"
                  >
                    <Folder className="h-5 w-5 text-amber-500 group-hover:scale-105 transition-transform shrink-0" />
                    <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {folder.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg px-4 py-2.5">
            {error}
          </div>
        )}

        {/* Move Dialog / Bar */}
        {movingId && (
          <div className="mb-4 flex flex-wrap items-center gap-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200">
            <FolderInput size={18} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="text-sm font-medium">Select destination folder:</span>
            <select
              value={moveValue}
              onChange={(e) => setMoveValue(e.target.value)}
              className="flex-1 min-w-[200px] border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
            >
              <option value="">Root folder (No parent)</option>
              {folders.map((f) => (
                <option key={f._id} value={f._id}>
                  📁 {f.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => confirmMove(movingId)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Move
            </button>
            <button
              onClick={cancelMove}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-medium px-3 py-1.5 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Copy Dialog / Bar */}
        {copyingId && (
          <div className="mb-4 flex flex-wrap items-center gap-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200">
            <Copy size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-sm font-medium">Select destination folder:</span>
            <select
              value={copyValue}
              onChange={(e) => setCopyValue(e.target.value)}
              className="flex-1 min-w-[200px] border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
            >
              <option value="">Root folder (No parent)</option>
              {folders.map((f) => (
                <option key={f._id} value={f._id}>
                  📁 {f.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => confirmCopy(copyingId)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Copy
            </button>
            <button
              onClick={cancelCopy}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-medium px-3 py-1.5 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Files Table */}
        <div ref={menuContainerRef} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/40">
                  <th className="font-medium px-5 py-3">Name</th>
                  <th className="font-medium px-5 py-3">Size</th>
                  <th className="font-medium px-5 py-3">Last Updated</th>
                  <th className="font-medium px-5 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-slate-400 dark:text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                        <span>Loading files...</span>
                      </div>
                    </td>
                  </tr>
                ) : displayedFiles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-slate-400 dark:text-slate-500">
                      {currentFolderId
                        ? 'This folder is empty.'
                        : filterQuery === 'favorites'
                        ? 'No favorite files found.'
                        : 'No files yet. Upload one to get started.'}
                    </td>
                  </tr>
                ) : (
                  displayedFiles.map((file) => (
                    <tr
                      key={file._id}
                      className="border-b border-slate-50 dark:border-slate-800/80 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg p-2 shrink-0">
                            <FileText size={16} />
                          </div>
                          {renamingId === file._id ? (
                            <input
                              autoFocus
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onBlur={() => confirmRename(file._id)}
                              onKeyDown={(e) => e.key === 'Enter' && confirmRename(file._id)}
                              className="border border-blue-300 dark:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                            />
                          ) : (
                            <span className="font-medium text-slate-900 dark:text-white">{file.fileName}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                        {formatSize(file.fileSize)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                        {timeAgo(file.updatedAt)}
                      </td>
                      <td className="px-5 py-3.5 relative text-right">
                        <button
                          type="button"
                          onClick={() => setOpenMenuId(openMenuId === file._id ? null : file._id)}
                          className="text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          aria-label="File Actions"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {/* Dropdown Action Menu with Dark Mode */}
                        {openMenuId === file._id ? (
                          <div className="absolute right-5 top-10 z-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 w-40 text-slate-700 dark:text-slate-200">
                            <a
                              href={getDownloadUrl(file.storageKey)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
                            >
                              <Download size={14} />
                              <span>Download</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => startRename(file)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 w-full text-left transition-colors cursor-pointer"
                            >
                              <Edit2 size={14} />
                              <span>Rename</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => startMove(file)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 w-full text-left transition-colors cursor-pointer"
                            >
                              <FolderInput size={14} />
                              <span>Move</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => startCopy(file)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 w-full text-left transition-colors cursor-pointer"
                            >
                              <Copy size={14} />
                              <span>Copy</span>
                            </button>
                            <div className="border-t border-slate-100 dark:border-slate-700/60 my-1" />
                            <button
                              type="button"
                              onClick={() => promptDelete(file._id, file.fileName)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 w-full text-left transition-colors cursor-pointer"
                            >
                              <Trash2 size={14} />
                              <span>Delete</span>
                            </button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <ConfirmDialog
          open={!!fileToDelete}
          title="Delete File"
          description={`Are you sure you want to delete "${fileToDelete?.name}"? This action cannot be undone.`}
          confirmLabel="Delete File"
          destructive={true}
          busy={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setFileToDelete(null)}
        />
      </div>
    </div>
  );
}