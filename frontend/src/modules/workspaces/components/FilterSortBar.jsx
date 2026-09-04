import { useEffect, useRef, useState } from 'react';

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
  { value: 'updated-desc', label: 'Last updated (newest)' },
  { value: 'updated-asc', label: 'Last updated (oldest)' },
];

export function FilterSortBar({ view, onViewChange, query, onQueryChange, sortKey, onSortKeyChange, lastUpdatedLabel }) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const filterRef = useRef(null);
  const sortRef = useRef(null);

  useEffect(() => {
    function handleClick(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) setFilterOpen(false);
      if (sortRef.current && !sortRef.current.contains(event.target)) setSortOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortKey)?.label ?? 'Sort';

  return (
    <div className="mb-3 flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2 shadow-card">
      <div className="flex items-center gap-1">
        <div className="flex overflow-hidden rounded-lg border border-border">
          <button
            type="button"
            aria-label="List view"
            onClick={() => onViewChange('list')}
            className={`p-1.5 ${view === 'list' ? 'bg-canvas text-ink-900' : 'text-ink-400 hover:bg-canvas'}`}
          >
            <ListIcon />
          </button>
          <button
            type="button"
            aria-label="Grid view"
            onClick={() => onViewChange('grid')}
            className={`border-l border-border p-1.5 ${view === 'grid' ? 'bg-canvas text-ink-900' : 'text-ink-400 hover:bg-canvas'}`}
          >
            <GridIcon />
          </button>
        </div>

        <span className="mx-1.5 h-5 w-px bg-border" />

        <div className="relative" ref={filterRef}>
          <button
            type="button"
            onClick={() => {
              setFilterOpen((v) => !v);
              setSortOpen(false);
            }}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-ink-500 hover:bg-canvas"
          >
            <FilterIcon /> Filter
            {query && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
          </button>
          {filterOpen && (
            <div className="absolute left-0 z-10 mt-1 w-64 rounded-lg border border-border bg-surface p-3 shadow-popover">
              <label htmlFor="filter-name" className="mb-1 block text-xs font-medium text-ink-500">
                Folder name contains
              </label>
              <input
                id="filter-name"
                autoFocus
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="e.g. Design"
                className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm focus:border-accent focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => onQueryChange('')}
                  className="mt-2 text-xs font-medium text-accent hover:underline"
                >
                  Clear filter
                </button>
              )}
            </div>
          )}
        </div>

        <div className="relative" ref={sortRef}>
          <button
            type="button"
            onClick={() => {
              setSortOpen((v) => !v);
              setFilterOpen(false);
            }}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-ink-500 hover:bg-canvas"
          >
            <SortIcon /> {currentSortLabel === 'Sort' ? 'Sort' : currentSortLabel}
          </button>
          {sortOpen && (
            <div className="absolute left-0 z-10 mt-1 w-52 rounded-lg border border-border bg-surface py-1 shadow-popover">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onSortKeyChange(option.value);
                    setSortOpen(false);
                  }}
                  className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-canvas ${
                    sortKey === option.value ? 'font-medium text-accent' : 'text-ink-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-ink-400">
        <ClockIcon /> {lastUpdatedLabel}
      </div>
    </div>
  );
}

function ListIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4h7v7H4V4zM13 4h7v7h-7V4zM4 13h7v7H4v-7zM13 13h7v7h-7v-7z"
      />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18l-7 8v6l-4 2v-8L3 4z" />
    </svg>
  );
}

function SortIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h13M3 12h9M3 17h5M17 4v16m0 0l-3-3m3 3l3-3" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
