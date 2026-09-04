import React, { useState, useEffect } from 'react';
import { fetchVersionHistory, restoreVersion, createVersionSnapshot, deleteVersionSnapshot } from './historyApi.js';

/**
 * VersionHistoryDrawer Component
 * Owner: Aiman
 * 
 * Requirement 6: Version History
 * - View previous versions list with timestamps & authors
 * - Professional centered popup modal for creating manual snapshots (+ Snapshot)
 * - Professional centered popup modal for confirming version restorations (Restore)
 * - Professional centered popup modal for deleting past version snapshots (Delete)
 * - Non-destructive version restoration with real-time editor state synchronization
 */
export function VersionHistoryDrawer({
  isOpen,
  onClose,
  documentId,
  currentTitle,
  currentContent,
  onVersionRestored,
  onSelectVersionPreview
}) {
  const [versions, setVersions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Snapshot modal state
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);
  const [snapshotSummary, setSnapshotSummary] = useState('');
  const [isSavingSnapshot, setIsSavingSnapshot] = useState(false);

  // Restore modal state
  const [restoreTargetVersion, setRestoreTargetVersion] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Delete modal state
  const [deleteTargetVersion, setDeleteTargetVersion] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load version history when drawer opens or documentId changes
  useEffect(() => {
    if (isOpen && documentId) {
      loadHistory();
    }
  }, [isOpen, documentId]);

  // Clear success notification after 4 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  async function loadHistory() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchVersionHistory(documentId);
      setVersions(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load version history');
    } finally {
      setIsLoading(false);
    }
  }

  function getActiveUserAuthorName() {
    try {
      const localUser = localStorage.getItem('user');
      if (localUser) {
        const parsed = JSON.parse(localUser);
        if (parsed && (parsed.name || parsed.fullName)) return parsed.name || parsed.fullName;
      }
    } catch { /* fallback */ }
    return 'Active Editor';
  }

  // Submit manual snapshot creation from centered modal
  async function handleConfirmCreateSnapshot(e) {
    if (e) e.preventDefault();
    setIsSavingSnapshot(true);
    setError(null);

    try {
      const formattedContent =
        typeof currentContent === 'object'
          ? JSON.stringify(currentContent)
          : (currentContent || '');

      const activeAuthor = getActiveUserAuthorName();
      const res = await createVersionSnapshot(documentId, {
        title: currentTitle || 'Untitled Document',
        content: formattedContent,
        changeSummary: snapshotSummary.trim() || 'Manual version snapshot',
        createdBy: activeAuthor
      });

      if (res?.data) {
        setVersions(prev => [res.data, ...prev.filter(v => v.id !== res.data.id)]);
      }

      setIsSnapshotModalOpen(false);
      setSnapshotSummary('');
      setSuccessMessage('Version snapshot created successfully!');
      await loadHistory();
    } catch (err) {
      setError(`Snapshot failed: ${err.message}`);
    } finally {
      setIsSavingSnapshot(false);
    }
  }

  // Submit version restoration from centered modal
  async function handleConfirmRestoreVersion() {
    if (!restoreTargetVersion) return;
    setIsRestoring(true);
    setError(null);

    try {
      const activeAuthor = getActiveUserAuthorName();
      const result = await restoreVersion(documentId, restoreTargetVersion.id, activeAuthor);
      if (result?.data) {
        setVersions(prev => [result.data, ...prev.filter(v => v.id !== result.data.id)]);
      }
      if (onVersionRestored) {
        onVersionRestored(result?.data);
      }
      setSuccessMessage(`Restored Version #${restoreTargetVersion.versionNumber} as new latest version.`);
      setRestoreTargetVersion(null);
      await loadHistory();
    } catch (err) {
      setError(`Restore failed: ${err.message}`);
    } finally {
      setIsRestoring(false);
    }
  }

  // Submit version deletion from centered modal
  async function handleConfirmDeleteVersion() {
    if (!deleteTargetVersion) return;
    setIsDeleting(true);
    setError(null);

    try {
      await deleteVersionSnapshot(deleteTargetVersion.id);
      setSuccessMessage(`Version #${deleteTargetVersion.versionNumber} deleted successfully.`);
      setDeleteTargetVersion(null);
      await loadHistory();
    } catch (err) {
      setError(`Delete failed: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  }

  function formatAuthorName(name) {
    if (!name || name === 'Unknown User' || name === 'Unknown' || (typeof name === 'string' && (name.startsWith('66cc') || name.length === 24))) {
      return getActiveUserAuthorName();
    }
    return name;
  }

  function formatDate(isoString) {
    if (!isoString) return 'Unknown date';
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Right Collapsible Version History Drawer Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '400px',
          maxWidth: '100vw',
          backgroundColor: '#ffffff',
          boxShadow: '-6px 0 20px rgba(0,0,0,0.12)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f8fafc'
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
              📜 Version History
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Document ID: {documentId}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                setSnapshotSummary('');
                setIsSnapshotModalOpen(true);
              }}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                boxShadow: '0 1px 3px rgba(37,99,235,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Create manual version snapshot"
            >
              <span>+</span> Snapshot
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#64748b',
                padding: '4px 8px',
                borderRadius: '4px'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div
            style={{
              padding: '10px 16px',
              backgroundColor: '#f0fdf4',
              color: '#15803d',
              borderBottom: '1px solid #bbf7d0',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 500
            }}
          >
            <span>✅</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div
            style={{
              padding: '10px 16px',
              backgroundColor: '#fef2f2',
              color: '#991b1b',
              borderBottom: '1px solid #fecaca',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Drawer Body / Version Timeline */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '32px', color: '#64748b', fontSize: '14px' }}>
              ⏳ Loading version timeline...
            </div>
          )}

          {!isLoading && versions.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px', color: '#64748b', fontSize: '14px' }}>
              No version history found for this document.
            </div>
          )}

          {!isLoading &&
            versions.map((version, index) => {
              const isCurrent = index === 0;
              return (
                <div
                  key={version.id}
                  style={{
                    border: '1px solid',
                    borderColor: isCurrent ? '#93c5fd' : '#e2e8f0',
                    borderRadius: '10px',
                    padding: '14px',
                    marginBottom: '14px',
                    backgroundColor: isCurrent ? '#eff6ff' : '#ffffff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Version Title & Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                      Version #{version.versionNumber}
                    </span>
                    {isCurrent ? (
                      <span
                        style={{
                          fontSize: '11px',
                          backgroundColor: '#2563eb',
                          color: '#ffffff',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontWeight: 600
                        }}
                      >
                        Current Active
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>
                        v{version.versionNumber}.0
                      </span>
                    )}
                  </div>

                  {/* Author & Timestamp */}
                  <div style={{ fontSize: '12px', color: '#475569', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>👤</span>
                    <span><strong>Author:</strong> {formatAuthorName(version.createdBy)}</span>
                  </div>

                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🕒</span>
                    <span><strong>Date:</strong> {formatDate(version.createdAt)}</span>
                  </div>

                  {/* Summary / Commit Message */}
                  {version.changeSummary && (
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#334155',
                        backgroundColor: isCurrent ? '#ffffff' : '#f8fafc',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid',
                        borderColor: isCurrent ? '#bfdbfe' : '#e2e8f0',
                        marginBottom: '12px',
                        fontStyle: 'italic'
                      }}
                    >
                      📝 "{version.changeSummary}"
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => onSelectVersionPreview && onSelectVersionPreview(version)}
                      style={{
                        flex: 1,
                        padding: '7px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '3px'
                      }}
                    >
                      👁️ Preview
                    </button>

                    <button
                      type="button"
                      disabled={isCurrent}
                      onClick={() => setRestoreTargetVersion(version)}
                      style={{
                        flex: 1,
                        padding: '7px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: isCurrent ? '#f1f5f9' : '#2563eb',
                        color: isCurrent ? '#94a3b8' : '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: isCurrent ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '3px'
                      }}
                    >
                      ↺ Restore
                    </button>

                    {!isCurrent && (
                      <button
                        type="button"
                        onClick={() => setDeleteTargetVersion(version)}
                        style={{
                          padding: '7px 10px',
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: '#fef2f2',
                          color: '#dc2626',
                          border: '1px solid #fecaca',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Delete this version snapshot"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CENTERED POPUP MODAL 1: Create Manual Version Snapshot */}
      {/* ========================================================================= */}
      {isSnapshotModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              width: '460px',
              maxWidth: '90vw',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            {/* Modal Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  📸 Create Version Snapshot
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                  Save a named point-in-time snapshot to the document timeline.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSnapshotModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#94a3b8'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleConfirmCreateSnapshot} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label
                  htmlFor="snapshotSummaryInput"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}
                >
                  Version Description / Change Summary
                </label>
                <input
                  id="snapshotSummaryInput"
                  type="text"
                  value={snapshotSummary}
                  onChange={(e) => setSnapshotSummary(e.target.value)}
                  placeholder="e.g. Added section 3, revised title formatting"
                  autoFocus
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsSnapshotModalOpen(false)}
                  disabled={isSavingSnapshot}
                  style={{
                    padding: '9px 16px',
                    fontSize: '13px',
                    fontWeight: 600,
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSnapshot}
                  style={{
                    padding: '9px 20px',
                    fontSize: '13px',
                    fontWeight: 600,
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: isSavingSnapshot ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 4px rgba(37,99,235,0.3)'
                  }}
                >
                  {isSavingSnapshot ? 'Saving Snapshot...' : 'Save Snapshot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CENTERED POPUP MODAL 2: Confirm Version Restoration */}
      {/* ========================================================================= */}
      {restoreTargetVersion && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              width: '480px',
              maxWidth: '90vw',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            {/* Modal Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  ↺ Restore Previous Version?
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                  Are you sure you want to restore <strong>Version #{restoreTargetVersion.versionNumber}</strong>?
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRestoreTargetVersion(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#94a3b8'
                }}
              >
                ✕
              </button>
            </div>

            {/* Target Details Card */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '14px',
                fontSize: '13px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div><strong>Version Number:</strong> Version #{restoreTargetVersion.versionNumber}</div>
              <div><strong>Original Author:</strong> {restoreTargetVersion.createdBy || 'Unknown'}</div>
              <div><strong>Created Date:</strong> {formatDate(restoreTargetVersion.createdAt)}</div>
              {restoreTargetVersion.changeSummary && (
                <div><strong>Summary:</strong> "{restoreTargetVersion.changeSummary}"</div>
              )}
            </div>

            {/* Warning Note */}
            <div
              style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '12px',
                color: '#1e40af',
                lineHeight: 1.5
              }}
            >
              💡 <strong>Note:</strong> Restoring will create a brand new latest version containing this content. Existing versions in the history timeline will remain intact.
            </div>

            {/* Modal Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setRestoreTargetVersion(null)}
                disabled={isRestoring}
                style={{
                  padding: '9px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestoreVersion}
                disabled={isRestoring}
                style={{
                  padding: '9px 20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isRestoring ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 4px rgba(37,99,235,0.3)'
                }}
              >
                {isRestoring ? 'Restoring Version...' : 'Confirm Restore'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CENTERED POPUP MODAL 3: Confirm Version Deletion */}
      {/* ========================================================================= */}
      {deleteTargetVersion && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              width: '460px',
              maxWidth: '90vw',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            {/* Modal Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#dc2626' }}>
                  🗑️ Delete Version Snapshot?
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                  Are you sure you want to permanently delete <strong>Version #{deleteTargetVersion.versionNumber}</strong>?
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTargetVersion(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#94a3b8'
                }}
              >
                ✕
              </button>
            </div>

            {/* Target Info */}
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '13px',
                color: '#991b1b',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div><strong>Version:</strong> Version #{deleteTargetVersion.versionNumber}</div>
              <div><strong>Author:</strong> {deleteTargetVersion.createdBy || 'Unknown'}</div>
              {deleteTargetVersion.changeSummary && <div><strong>Summary:</strong> "{deleteTargetVersion.changeSummary}"</div>}
              <div style={{ fontSize: '11px', color: '#b91c1c', marginTop: '4px', fontWeight: 600 }}>
                ⚠️ Warning: This action cannot be undone.
              </div>
            </div>

            {/* Modal Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setDeleteTargetVersion(null)}
                disabled={isDeleting}
                style={{
                  padding: '9px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteVersion}
                disabled={isDeleting}
                style={{
                  padding: '9px 20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 4px rgba(220,38,38,0.3)'
                }}
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default VersionHistoryDrawer;
