import React, { useState, useEffect } from 'react';
import { fetchVersionHistory, restoreVersion } from './historyApi.js';

/**
 * VersionHistoryDrawer Component
 * Owner: Aiman
 * 
 * Requirement 6: Version History
 * - View previous versions list
 * - See who made changes (Author)
 * - See when changes were made (Timestamp)
 * - Restore an old version
 */
export function VersionHistoryDrawer({
  isOpen,
  onClose,
  documentId,
  onVersionRestored,
  onSelectVersionPreview
}) {
  const [versions, setVersions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [restoringId, setRestoringId] = useState(null);

  // Load version history when drawer opens or documentId changes
  useEffect(() => {
    if (isOpen && documentId) {
      loadHistory();
    }
  }, [isOpen, documentId]);

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

  async function handleRestore(version) {
    const confirmRestore = window.confirm(
      `Are you sure you want to restore Version #${version.versionNumber}? This will create a new latest version with its content.`
    );
    if (!confirmRestore) return;

    setRestoringId(version.id);
    try {
      const result = await restoreVersion(documentId, version.id);
      if (onVersionRestored) {
        onVersionRestored(result.data);
      }
      await loadHistory(); // Refresh timeline list
    } catch (err) {
      alert(`Restore failed: ${err.message}`);
    } finally {
      setRestoringId(null);
    }
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
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '380px',
        backgroundColor: '#ffffff',
        boxShadow: '-4px 0 12px rgba(0,0,0,0.15)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Drawer Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f8fafc'
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
            Version History
          </h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Document ID: {documentId}
          </span>
        </div>
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

      {/* Drawer Body / Version Timeline */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
            Loading history...
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#fef2f2',
              color: '#991b1b',
              borderRadius: '6px',
              marginBottom: '12px',
              fontSize: '13px'
            }}
          >
            {error}
          </div>
        )}

        {!isLoading && !error && versions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px', color: '#64748b', fontSize: '14px' }}>
            No version history found for this document.
          </div>
        )}

        {!isLoading &&
          versions.map((version, index) => (
            <div
              key={version.id}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '14px',
                marginBottom: '12px',
                backgroundColor: index === 0 ? '#f0fdf4' : '#ffffff',
                borderColor: index === 0 ? '#bbf7d0' : '#e2e8f0'
              }}
            >
              {/* Version Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>
                  Version #{version.versionNumber}
                </span>
                {index === 0 && (
                  <span
                    style={{
                      fontSize: '11px',
                      backgroundColor: '#22c55e',
                      color: '#ffffff',
                      padding: '2px 6px',
                      borderRadius: '12px',
                      fontWeight: 500
                    }}
                  >
                    Current Version
                  </span>
                )}
              </div>

              {/* Requirement: See who made changes & when */}
              <div style={{ fontSize: '13px', color: '#475569', marginBottom: '4px' }}>
                👤 <strong>Changed by:</strong> {version.createdBy || 'Unknown'}
              </div>

              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                🕒 <strong>Date:</strong> {formatDate(version.createdAt)}
              </div>

              {version.changeSummary && (
                <div
                  style={{
                    fontSize: '12px',
                    color: '#334155',
                    backgroundColor: '#f1f5f9',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    marginBottom: '10px'
                  }}
                >
                  📝 {version.changeSummary}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => onSelectVersionPreview && onSelectVersionPreview(version)}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    fontSize: '12px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: '#334155'
                  }}
                >
                  👁️ Preview
                </button>

                {/* Requirement: Restore old version button */}
                <button
                  type="button"
                  disabled={restoringId === version.id || index === 0}
                  onClick={() => handleRestore(version)}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    fontSize: '12px',
                    backgroundColor: index === 0 ? '#e2e8f0' : '#2563eb',
                    color: index === 0 ? '#94a3b8' : '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: index === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  {restoringId === version.id ? 'Restoring...' : '↺ Restore'}
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
