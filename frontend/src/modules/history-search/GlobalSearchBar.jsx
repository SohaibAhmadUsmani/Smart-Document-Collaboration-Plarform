import React, { useState } from 'react';
import { searchDocuments } from './historyApi.js';
import { extractPlainTextFromAst } from '../editor/utils/astConverters.js';

function formatSnippet(snippet) {
  if (!snippet) return '';
  let parsed = snippet;
  if (typeof snippet === 'string' && snippet.trim().startsWith('{')) {
    try {
      parsed = JSON.parse(snippet);
    } catch {
      return snippet;
    }
  }
  if (typeof parsed === 'object' && parsed !== null) {
    const text = extractPlainTextFromAst(parsed);
    if (text) return text.slice(0, 140);
  }
  return typeof snippet === 'string' ? snippet.slice(0, 140) : '';
}

/**
 * GlobalSearchBar Component
 * Owner: Aiman
 * 
 * Global search overlay allowing users to search across documents, titles, folders, users, and content.
 */
export function GlobalSearchBar({
  isOpen,
  onClose,
  onSelectResult
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // all, documents, folders, users, content
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  async function handleSearch(e) {
    if (e) e.preventDefault();
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

  // Filter results based on active entity tab
  const filteredResults = results.filter((item) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'documents') return item.type === 'document' || !item.type;
    if (selectedFilter === 'folders') return item.type === 'folder';
    if (selectedFilter === 'users') return item.type === 'user';
    if (selectedFilter === 'content') return item.type === 'content' || item.matchedContentSnippet;
    return true;
  });

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
        justifyContent: 'center',
        paddingTop: '70px',
        zIndex: 1200,
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '680px',
          maxWidth: '92vw',
          maxHeight: '75vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        {/* Search Input Bar */}
        <form
          onSubmit={handleSearch}
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            backgroundColor: '#f8fafc'
          }}
        >
          <span style={{ fontSize: '20px', color: '#64748b' }}>🔍</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (e.target.value.trim().length > 1) {
                handleSearch();
              }
            }}
            placeholder="Search documents, folders, users, or content..."
            autoFocus
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '16px',
              color: '#0f172a',
              backgroundColor: 'transparent'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '7px 16px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
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
              fontSize: '20px',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: '4px 8px',
              borderRadius: '4px'
            }}
          >
            ✕
          </button>
        </form>

        {/* Entity Filters Bar (Documents, Folders, Users, Workspace Content) */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '10px 20px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #f1f5f9',
            overflowX: 'auto'
          }}
        >
          {[
            { id: 'all', label: 'All Results' },
            { id: 'documents', label: '📄 Documents' },
            { id: 'folders', label: '📁 Folders' },
            { id: 'users', label: '👤 Users' },
            { id: 'content', label: '📝 Workspace Content' }
          ].map((tab) => {
            const isActive = selectedFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedFilter(tab.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: isActive ? '#2563eb' : '#cbd5e1',
                  backgroundColor: isActive ? '#eff6ff' : '#ffffff',
                  color: isActive ? '#2563eb' : '#475569',
                  fontSize: '12px',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Results List */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, backgroundColor: '#f8fafc' }}>
          {isSearching && (
            <div style={{ textAlign: 'center', padding: '32px', color: '#64748b', fontSize: '14px' }}>
              ⏳ Searching workspace records...
            </div>
          )}

          {!isSearching && hasSearched && filteredResults.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px', color: '#64748b', fontSize: '14px' }}>
              No results found for "{searchTerm}" under {selectedFilter} filter.
            </div>
          )}

          {!isSearching &&
            filteredResults.map((result) => (
              <div
                key={result.documentId || result.id}
                onClick={() => {
                  if (onSelectResult) onSelectResult(result);
                  onClose();
                }}
                style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '10px',
                  cursor: 'pointer',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  transition: 'transform 0.1s ease, box-shadow 0.1s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>
                    {result.type === 'folder' ? '📁' : result.type === 'user' ? '👤' : '📄'} {result.title}
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      backgroundColor: '#e2e8f0',
                      color: '#475569',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontWeight: 600
                    }}
                  >
                    {result.type || 'Document'}
                  </span>
                </div>

                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                  Document ID: {result.documentId || result.id} • Version #{result.versionNumber || 1}
                </div>

                {result.matchedContentSnippet && (
                  <div style={{ fontSize: '13px', color: '#334155', backgroundColor: '#f1f5f9', padding: '8px 12px', borderRadius: '6px', fontStyle: 'italic' }}>
                    "{formatSnippet(result.matchedContentSnippet)}..."
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default GlobalSearchBar;
