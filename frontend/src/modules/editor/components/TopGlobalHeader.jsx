/**
 * @file TopGlobalHeader.jsx
 * @description Top global navigation bar component for DocSync Pro.
 * Provides global workspace search (with Cmd+K focus), notification dropdown, and user profile menu.
 * @module frontend/src/modules/editor/components/TopGlobalHeader
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh global navigation bar hai jisme Cmd+K search input, notifications dropdown,
 * aur user profile menu shaamil hain. Mobile screens par search input smoothly
 * shrink hota hai taake buttons overflow na hon. Escape key aur click-outside
 * se dropdowns band hote hain.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, ChevronDown, Command, CheckCheck, User, Settings, LogOut, X } from 'lucide-react';
import { MOCK_CURRENT_USER } from '../services/mockData.js';

/**
 * TopGlobalHeader Component (DocSync Pro Global Navigation).
 *
 * [ROMAN URDU]:
 * Top-level application header jo workspace search, notifications modal, aur user menu render karta hai.
 *
 * @param {Object} props
 * @param {Function} [props.onSearchClick] - Optional callback when search is submitted or opened
 * @returns {React.JSX.Element}
 */
export function TopGlobalHeader({ onSearchClick }) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const searchInputRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Global CMD+K shortcut listener to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        setShowNotifications(false);
        setShowProfile(false);
        if (searchFocused) {
          searchInputRef.current?.blur();
          setSearchFocused(false);
        }
      }
    };

    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchFocused]);

  const handleClearSearch = () => {
    setSearchValue('');
    searchInputRef.current?.focus();
  };

  return (
    <header
      role="banner"
      aria-label="Global Application Header"
      className="h-13 w-full px-3 sm:px-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-50 select-none"
    >
      {/* Left: Global Search Input with responsive expansion */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-md mr-2">
        <div
          className={`relative flex items-center transition-all duration-200 ease-out w-full ${
            searchFocused ? 'max-w-md' : 'max-w-[200px] xs:max-w-[240px] sm:max-w-xs'
          }`}
        >
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search documents..."
            aria-label="Search documents, files, and activity (Press Ctrl+K)"
            className="w-full h-8.5 pl-9 pr-14 sm:pr-16 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-700/60 focus:bg-white dark:focus:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-3 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all outline-none"
          />

          {/* Clear button or shortcut badge */}
          {searchValue ? (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label="Clear search text"
              className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="hidden sm:flex absolute right-2.5 items-center gap-0.5 text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-700/60 px-1.5 py-0.5 rounded pointer-events-none">
              <Command className="w-3 h-3" />
              <span>K</span>
            </div>
          )}
        </div>
      </div>

      {/* Right: Notifications & Profile Dropdown */}
      <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
        {/* Notification Bell with Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setShowNotifications((prev) => !prev);
              setShowProfile(false);
            }}
            aria-haspopup="dialog"
            aria-expanded={showNotifications}
            aria-label="Notifications (1 new)"
            className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
          </button>

          {showNotifications && (
            <div
              role="dialog"
              aria-label="Recent notifications"
              className="absolute right-0 top-11 w-72 sm:w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Notifications</span>
                <button
                  type="button"
                  onClick={() => alert('Marked all as read')}
                  className="text-[10px] text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" /> Mark all read
                </button>
              </div>
              <div className="py-2 space-y-2 text-xs">
                <div className="p-2 rounded-lg bg-blue-50/50 dark:bg-blue-950/40 hover:bg-blue-50 dark:hover:bg-blue-900/40 cursor-pointer">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">Sarah Chen commented</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">"Should we increase the target to 30%?"</p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">10m ago</span>
                </div>
                <div className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">Marcus Thorne joined workspace</p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">1h ago</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => {
              setShowProfile((prev) => !prev);
              setShowNotifications(false);
            }}
            aria-haspopup="menu"
            aria-expanded={showProfile}
            aria-label={`User account menu for ${MOCK_CURRENT_USER.name}`}
            className="flex items-center gap-1.5 sm:gap-2 pl-1 pr-1.5 sm:pr-2 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 outline-none"
          >
            <img
              src={MOCK_CURRENT_USER.avatar}
              alt={MOCK_CURRENT_USER.name}
              className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
            />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 hidden md:inline">
              {MOCK_CURRENT_USER.name}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showProfile && (
            <div
              role="menu"
              aria-label="User profile options"
              className="absolute right-0 top-11 w-52 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 text-xs text-slate-700 dark:text-slate-300 animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="font-bold text-slate-900 dark:text-white">{MOCK_CURRENT_USER.name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{MOCK_CURRENT_USER.email}</p>
              </div>
              <button
                type="button"
                role="menuitem"
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                onClick={() => setShowProfile(false)}
              >
                <User className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> Profile & Account
              </button>
              <button
                type="button"
                role="menuitem"
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                onClick={() => setShowProfile(false)}
              >
                <Settings className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> Workspace Settings
              </button>
              <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
              <button
                type="button"
                role="menuitem"
                className="w-full text-left px-3.5 py-2 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center gap-2"
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

export default TopGlobalHeader;
