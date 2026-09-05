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
import { Search, ChevronDown, Command, User, Settings, LogOut, X, Home, ArrowLeft, Folder, Briefcase } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { SmartBackButton } from './SmartBackButton.jsx';
import { NotificationBell } from '../../notifications/components/NotificationBell.jsx';
import { useAuth } from '../../auth/context/AuthContext.jsx';

/**
 * TopGlobalHeader Component (DocSync Pro Global Navigation).
 *
 * @param {Object} props
 * @param {Function} [props.onSearchClick] - Optional callback when search is submitted or opened
 * @param {Function} [props.onNavigateToDocument] - Called with (documentId, commentId?) for navigation
 * @returns {React.JSX.Element}
 */
export function TopGlobalHeader({ onSearchClick, onNavigateToDocument }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  // Initialize authenticated user from localStorage immediately
  // localStorage se foran authenticated user profile load karein
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const rawUser = localStorage.getItem('user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        return {
          name: u.name || 'User',
          email: u.email || '',
          avatar: u.avatarUrl || u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&background=random`
        };
      }
    } catch (_) {}
    return {
      name: 'User',
      email: '',
      avatar: 'https://ui-avatars.com/api/?name=User&background=random'
    };
  });
  
  const searchInputRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleProfileUpdate = (e) => {
      // CustomEvent from user-profile-updated carries full user object in detail
      if (e?.detail) {
        const u = e.detail;
        setCurrentUser({
          name: u.name || 'User',
          email: u.email || '',
          avatar: u.avatarUrl || u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&background=random`
        });
        return;
      }
      // Native StorageEvent: re-read from localStorage when the 'user' key changes
      if (e?.key === 'user' || e?.type === 'storage') {
        try {
          const rawUser = localStorage.getItem('user');
          if (rawUser) {
            const u = JSON.parse(rawUser);
            setCurrentUser({
              name: u.name || 'User',
              email: u.email || '',
              avatar: u.avatarUrl || u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&background=random`
            });
          }
        } catch (_) {}
      }
    };

    window.addEventListener('storage', handleProfileUpdate);
    window.addEventListener('user-profile-updated', handleProfileUpdate);

    async function fetchUser() {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/users/me', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          // Backend returns { user: {...} } shape from getMyProfile
          const user = data.user || data.data || data;
          if (user && user.name) {
            setCurrentUser({
              name: user.name,
              email: user.email,
              avatar: user.avatarUrl || user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`
            });
            // Keep localStorage in sync with the latest server data
            try {
              const rawUser = localStorage.getItem('user');
              const existing = rawUser ? JSON.parse(rawUser) : {};
              localStorage.setItem('user', JSON.stringify({ ...existing, name: user.name, email: user.email }));
            } catch (_) {}
          }
        }
      } catch (err) {
        // Fallback already provided by localStorage
      }
    }
    fetchUser();

    return () => {
      window.removeEventListener('storage', handleProfileUpdate);
      window.removeEventListener('user-profile-updated', handleProfileUpdate);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setShowProfile(false);
    navigate('/login');
  };

  // Global CMD+K shortcut listener to focus search or open search modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (onSearchClick) {
          onSearchClick();
        } else {
          searchInputRef.current?.focus();
        }
      } else if (e.key === 'Escape') {
        setShowProfile(false);
        if (searchFocused) {
          searchInputRef.current?.blur();
          setSearchFocused(false);
        }
      }
    };

    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        // Notification bell handles its internal state
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
  }, [onSearchClick, searchFocused]);

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
      {/* Left: Navigation Controls & Global Search Input with responsive expansion */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 mr-3">
        {/* Navigation Group Pill */}
        <div className="flex items-center gap-0.5 p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/70 dark:border-slate-700/70 shadow-2xs flex-shrink-0">
          <SmartBackButton
            fallbackPath="/dashboard"
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all"
            iconClass="w-4 h-4"
            title="Go Back"
          />

          <Link
            to="/dashboard"
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all"
            title="Dashboard (Home)"
            aria-label="Go to Dashboard"
          >
            <Home className="w-4 h-4" />
          </Link>

          <Link
            to="/files"
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all"
            title="File Manager"
            aria-label="Go to File Manager"
          >
            <Folder className="w-4 h-4" />
          </Link>

          <Link
            to="/workspaces"
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all"
            title="Workspaces"
            aria-label="Go to Workspaces"
          >
            <Briefcase className="w-4 h-4" />
          </Link>
        </div>

        {/* Global Search Bar (Spacious, rounded-xl with clean keycap badge) */}
        <div
          onClick={() => onSearchClick?.()}
          className={`relative flex items-center transition-all duration-300 ease-out cursor-pointer ${
            searchFocused
              ? 'w-full max-w-lg'
              : 'w-full max-w-[240px] xs:max-w-[280px] sm:max-w-sm md:max-w-md'
          }`}
        >
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            readOnly={Boolean(onSearchClick)}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => {
              if (onSearchClick) onSearchClick();
              else setSearchFocused(true);
            }}
            onClick={() => onSearchClick?.()}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search documents, files, and workspaces..."
            aria-label="Search documents, files, and workspace (Press Ctrl+K)"
            className="w-full h-9 pl-9.5 pr-16 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl border border-slate-200/90 dark:border-slate-700/90 focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none shadow-2xs cursor-pointer"
          />

          {/* Clear button or shortcut badge */}
          {searchValue ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClearSearch();
              }}
              aria-label="Clear search text"
              className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="hidden sm:flex absolute right-2.5 items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700/80 px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-600/80 shadow-2xs pointer-events-none">
              <Command className="w-3 h-3 text-slate-400" />
              <span className="font-semibold">K</span>
            </div>
          )}
        </div>
      </div>

      {/* Right: Notifications & Profile */}
      <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
        {/* Notification Bell (real data from useNotifications) */}
        <NotificationBell onNavigateToDocument={onNavigateToDocument} />

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => {
              setShowProfile((prev) => !prev);
            }}
            aria-haspopup="menu"
            aria-expanded={showProfile}
            aria-label={`User account menu for ${currentUser.name}`}
            className="flex items-center gap-1.5 sm:gap-2 pl-1 pr-1.5 sm:pr-2 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 outline-none"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
            />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 hidden md:inline">
              {currentUser.name}
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
                <p className="font-bold text-slate-900 dark:text-white">{currentUser.name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</p>
              </div>
              <button
                type="button"
                role="menuitem"
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer"
                onClick={() => {
                  setShowProfile(false);
                  navigate('/settings');
                }}
              >
                <User className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> Profile & Account
              </button>
              <button
                type="button"
                role="menuitem"
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                onClick={() => { setShowProfile(false); navigate('/workspaces'); }}
              >
                <Settings className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> Workspace Settings
              </button>
              <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
              <button
                type="button"
                role="menuitem"
                className="w-full text-left px-3.5 py-2 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center gap-2"
                onClick={handleLogout}
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
