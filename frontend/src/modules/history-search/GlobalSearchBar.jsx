import React, { useState } from 'react';
import { searchDocuments } from './historyApi.js';

/**
 * GlobalSearchBar Component
 * Owner: Aiman
 * 
 * Global search overlay allowing users to search across documents, titles, and version content.
 */
export function GlobalSearchBar({
  isOpen,
  onClose,
  onSelectResult
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const response = await searchDocuments(searchTerm);
      setResults(response.data || []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        display: 'flex',
        justifyContent: 'center',
        paddingTop: '80px',
        zIndex: 1200,
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          width: '640px',
          maxWidth: '90vw',
          maxHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          overflow: 'hidden'
        }}
      >
        {/* Search Input Bar */}
        <form
          onSubmit={handleSearch}
          style={{
            padding: '16px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            gap: '12px',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '18px', color: '#64748b' }}>🔍</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search documents by title or content..."
            autoFocus
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '16px',
              color: '#0f172a'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '6px 14px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '13px'
            }}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#64748b'
            }}
          >
            ✕
          </button>
        </form>

        {/* Results List */}
        <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
          {isSearching && (
            <div style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
              Searching documents...
            </div>
          )}

          {!isSearching && hasSearched && results.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
              No document results found for "{searchTerm}".
            </div>
          )}

          {!isSearching &&
            results.map((result) => (
              <div
                key={result.documentId}
                onClick={() => {
                  if (onSelectResult) onSelectResult(result);
                  onClose();
                }}
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '10px',
                  cursor: 'pointer',
                  backgroundColor: '#ffffff',
                  transition: 'background-color 0.15s'
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '15px', color: '#0f172a', marginBottom: '4px' }}>
                  📄 {result.title}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                  Document ID: {result.documentId} • Version #{result.versionNumber}
                </div>
                <div style={{ fontSize: '13px', color: '#475569', backgroundColor: '#f8fafc', padding: '8px', borderRadius: '4px' }}>
                  "{result.matchedContentSnippet}..."
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
