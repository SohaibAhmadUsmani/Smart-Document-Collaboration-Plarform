import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Command, User, Settings, LogOut } from 'lucide-react';
import { NotificationBell } from '../../notifications/components/NotificationBell.jsx';
import { MOCK_CURRENT_USER } from '../services/mockData.js';

export function TopGlobalHeader({ onSearchClick }) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const searchInputRef = useRef(null);

  // Global CMD+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="h-13 w-full px-5 flex items-center justify-between border-b border-slate-200 bg-white sticky top-0 z-50 select-none">
      {/* Left: Global Search Input with focus expansion */}
      <div className="flex items-center gap-3">
        <div
          className={`relative flex items-center transition-all duration-200 ease-out ${
            searchFocused ? 'w-96' : 'w-72'
          }`}
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search documents, files, and activity..."
            className="w-full h-8.5 pl-9 pr-9 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs text-slate-800 placeholder-slate-400 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-3 focus:ring-blue-100 transition-all outline-none"
          />
          <div className="absolute right-2.5 flex items-center gap-0.5 text-[10px] font-mono text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded pointer-events-none">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Right: Notifications & Profile */}
      <div className="flex items-center gap-3">
        {/* Notification Bell (real data from useNotifications) */}
        <NotificationBell />

        {/* User Profile Dropdown */}
        <div className="relative">
          <div
            onClick={() => {
              setShowProfile((prev) => !prev);
            }}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <img
              src={MOCK_CURRENT_USER.avatar}
              alt={MOCK_CURRENT_USER.name}
              className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200"
            />
            <span className="text-xs font-semibold text-slate-800 hidden sm:inline">
              {MOCK_CURRENT_USER.name}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {showProfile && (
            <div className="absolute right-0 top-11 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3.5 py-2 border-b border-slate-100">
                <p className="font-bold text-slate-900">{MOCK_CURRENT_USER.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{MOCK_CURRENT_USER.email}</p>
              </div>
              <button
                type="button"
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2"
                onClick={() => setShowProfile(false)}
              >
                <User className="w-3.5 h-3.5 text-slate-500" /> Profile & Account
              </button>
              <button
                type="button"
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2"
                onClick={() => setShowProfile(false)}
              >
                <Settings className="w-3.5 h-3.5 text-slate-500" /> Workspace Settings
              </button>
              <div className="border-t border-slate-100 my-1"></div>
              <button
                type="button"
                className="w-full text-left px-3.5 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
                onClick={() => setShowProfile(false)}
              >
                <LogOut className="w-3.5 h-3.5 text-red-500" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
