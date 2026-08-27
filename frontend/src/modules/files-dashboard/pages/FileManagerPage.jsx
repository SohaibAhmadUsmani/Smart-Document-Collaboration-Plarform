import React, { useEffect, useState, useRef } from 'react';
import { Upload, FileText, Download, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { listFiles, uploadFile, renameFile, deleteFile, getDownloadUrl } from '../services/filesDashboardApi.js';

const DEFAULT_WORKSPACE_ID = 'test-workspace-1';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function FileManagerPage({ workspaceId = DEFAULT_WORKSPACE_ID }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const fileInputRef = useRef(null);

  async function loadFiles() {
    setLoading(true);
    const res = await listFiles(workspaceId);
    if (res.ok) {
      setFiles(res.data.data);
      setError(null);
    } else {
      setError(res.error || 'Failed to load files');
    }
    setLoading(false);
  }

  useEffect(() => {
    loadFiles();
  }, [workspaceId]);

  async function handleFileSelected(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploading(true);
    const res = await uploadFile({ file, workspaceId });
    setUploading(false);
    if (res.ok) {
      await loadFiles();
    } else {
      setError(res.error || 'Upload failed');
    }
    e.target.value = '';
  }

  async function handleDelete(fileId) {
    setOpenMenuId(null);
    const res = await deleteFile(fileId);
    if (res.ok) {
      setFiles((prev) => prev.filter((f) => f._id !== fileId));
    } else {
      setError(res.error || 'Delete failed');
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

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Files</h1>
          <p className="text-slate-500 mt-1">Upload, organize, and manage your files.</p>
        </div>
        <button
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          disabled={uploading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Upload size={16} />
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg"
          onChange={handleFileSelected}
        />
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-slate-500">
              <th className="font-medium px-5 py-3">Name</th>
              <th className="font-medium px-5 py-3">Size</th>
              <th className="font-medium px-5 py-3">Last Updated</th>
              <th className="font-medium px-5 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                  Loading files...
                </td>
              </tr>
            ) : files.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                  No files yet. Upload one to get started.
                </td>
              </tr>
            ) : (
              files.map((file) => (
                <tr key={file._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 text-slate-500 rounded-lg p-2 shrink-0">
                        <FileText size={16} />
                      </div>
                      {renamingId === file._id ? (
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={() => confirmRename(file._id)}
                          onKeyDown={(e) => e.key === 'Enter' && confirmRename(file._id)}
                          className="border border-blue-300 rounded px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                        />
                      ) : (
                        <span className="font-medium text-slate-900">{file.fileName}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{formatSize(file.fileSize)}</td>
                  <td className="px-5 py-3 text-slate-500">{timeAgo(file.updatedAt)}</td>
                  <td className="px-5 py-3 relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === file._id ? null : file._id)}
                      className="text-slate-400 hover:text-slate-700 p-1 rounded"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {openMenuId === file._id ? (
                      <div className="absolute right-5 top-10 z-10 bg-white border border-slate-200 rounded-lg shadow-lg py-1 w-36">
<a                        
                          href={getDownloadUrl(file.storageKey)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <Download size={14} />
                          <span>Download</span>
                        </a>
                        <button
                          onClick={() => startRename(file)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 w-full text-left"
                        >
                          <Edit2 size={14} />
                          <span>Rename</span>
                        </button>
                        <button
                          onClick={() => handleDelete(file._id)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
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
  );
}