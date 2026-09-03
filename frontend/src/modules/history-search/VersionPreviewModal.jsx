import React, { useState } from 'react';
import { extractPlainTextFromAst } from '../editor/utils/astConverters.js';

/**
 * VersionPreviewModal Component
 * Owner: Aiman
 * 
 * Centered modal offering a clean, human-readable document preview of past version snapshots
 * with direct restoration capabilities.
 */
export function VersionPreviewModal({
  version,
  onClose,
  onRestore
}) {
  const [isRestoring, setIsRestoring] = useState(false);

  if (!version) return null;

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

  // Helper to extract clean human-readable content display instead of raw JSON
  function renderContentPreview(content) {
    if (!content) return <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No content available for this version snapshot.</p>;

    let parsed = content;
    if (typeof content === 'string') {
      const trimmed = content.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          parsed = JSON.parse(trimmed);
        } catch {
          parsed = content;
        }
      }
    }

    // If parsed object is AST, extract human-readable plain text
    if (typeof parsed === 'object' && parsed !== null) {
      const text = extractPlainTextFromAst(parsed);
      if (text && text.trim()) {
        return (
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: '#1e293b', fontSize: '14px', fontFamily: 'sans-serif' }}>
            {text}
          </div>
        );
      }
    }

    if (typeof parsed === 'string') {
      return (
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: '#1e293b', fontSize: '14px', fontFamily: 'sans-serif' }}>
          {parsed}
        </div>
      );
    }

    return (
      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, fontFamily: 'monospace', fontSize: '13px' }}>
        {JSON.stringify(parsed, null, 2)}
      </pre>
    );
  }

  async function handleRestoreClick() {
    setIsRestoring(true);
    try {
      if (onRestore) {
        await onRestore(version);
      }
      onClose();
    } catch (err) {
      console.error('Failed to restore from preview:', err);
    } finally {
      setIsRestoring(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '720px',
          maxWidth: '92vw',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '19px', fontWeight: 700, color: '#0f172a' }}>
                👁️ Preview Version #{version.versionNumber}
              </h3>
              <span
                style={{
                  fontSize: '11px',
                  backgroundColor: '#e0f2fe',
                  color: '#0369a1',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  fontWeight: 600
                }}
              >
                Read-Only Snapshot
              </span>
            </div>
            <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
              Created by <strong>{formatAuthorName(version.createdBy)}</strong> on {formatDate(version.createdAt)}
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
              color: '#94a3b8',
              padding: '4px 8px',
              borderRadius: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, backgroundColor: '#f1f5f9' }}>
          {/* Document Title Header */}
          <div
            style={{
              marginBottom: '16px',
              padding: '12px 16px',
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}
          >
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Document Title
            </label>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
              {version.title || 'Untitled Document'}
            </div>
          </div>

          {/* Change Summary Tag */}
          {version.changeSummary && (
            <div
              style={{
                marginBottom: '16px',
                padding: '10px 14px',
                backgroundColor: '#eff6ff',
                borderRadius: '8px',
                border: '1px solid #bfdbfe',
                fontSize: '13px',
                color: '#1e40af'
              }}
            >
              📝 <strong>Change Summary:</strong> "{version.changeSummary}"
            </div>
          )}

          {/* Document Content Sheet */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', display: 'block' }}>
              Content Preview
            </label>
            <div
              style={{
                padding: '20px',
                backgroundColor: '#ffffff',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                maxHeight: '360px',
                overflowY: 'auto'
              }}
            >
              {renderContentPreview(version.content)}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 18px',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: '#f1f5f9',
              color: '#475569',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Close Preview
          </button>
          <button
            type="button"
            onClick={handleRestoreClick}
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
              boxShadow: '0 2px 4px rgba(37,99,235,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {isRestoring ? 'Restoring...' : `↺ Restore Version #${version.versionNumber}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default VersionPreviewModal;
