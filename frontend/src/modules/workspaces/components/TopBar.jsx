import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Files,
  FileEdit,
  FolderKanban,
  Settings,
  LogOut,
  ChevronDown,
  Search,
} from 'lucide-react';
import { Avatar } from '../../../components/Avatar';
import { NotificationBell } from '../../notifications/components/NotificationBell.jsx';
import { GlobalSearchBar } from '../../history-search/GlobalSearchBar.jsx';
import { useAuth } from '../../auth/context/AuthContext.jsx';

/**
 * TopBar Component
 *
 * English:
 * Global header navigation bar for the application. Features search functionality, direct active
 * navigation links to Dashboard, Workspaces, Files, and Document Editor, notifications trigger,
 * and an interactive user avatar with profile dropdown menu wired to /settings and authentication actions.
 *
 * Roman Urdu:
 * Application ka global header navigation bar. Isme search bar, Dashboard, Workspaces, Files aur Document Editor
 * ke clickable direct links, notifications, aur user profile dropdown menu shamil hai jo /settings aur logout
 * ke sath mukammal connected hai.
 *
 * @returns {JSX.Element}
 */
export function TopBar() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const menuRef = useRef(null);

  // Retrieve authenticated user from localStorage dynamically
  // Authenticated user ko dynamic tor par sunta aur state mein update karta hai
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const rawUser = localStorage.getItem('user');
      if (rawUser) {
        return JSON.parse(rawUser);
      }
    } catch (_) {}
    return { name: 'You', email: 'user@company.com', avatarUrl: null };
  });

  // Listen for storage or profile update events
  // Profile tabdeeli ya storage events sun kar user info update karein
  useEffect(() => {
    const handleProfileUpdate = (e) => {
      if (e?.detail) {
        setCurrentUser(e.detail);
      } else {
        try {
          const rawUser = localStorage.getItem('user');
          if (rawUser) setCurrentUser(JSON.parse(rawUser));
        } catch (_) {}
      }
    };

    window.addEventListener('storage', handleProfileUpdate);
    window.addEventListener('user-profile-updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('storage', handleProfileUpdate);
      window.removeEventListener('user-profile-updated', handleProfileUpdate);
    };
  }, []);

  // Global Ctrl+K / Cmd+K listener to open global search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown menu when clicking outside of it
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  /**
   * Handle user sign out
   * English: Clears session authentication tokens and routes to login page.
   * Roman Urdu: Session tokens clear karke login screen par bhej deta hai.
   */
  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/login');
  };

  /**
   * Navigate to settings page
   * English: Routes to settings configuration view.
   * Roman Urdu: Settings page par navigate karta hai.
   */
  const handleGoToSettings = () => {
    setMenuOpen(false);
    navigate('/settings');
  };

  const handleSelectSearchResult = (result) => {
    setIsSearchOpen(false);
    if (!result) return;
    if (result.type === 'folder') {
      navigate(`/workspaces?folderId=${result.id || result.documentId}`);
    } else if (result.type === 'file') {
      navigate(`/files?fileId=${result.id || result.documentId}`);
    } else {
      navigate(`/editor/${result.documentId || result.id}`);
    }
  };

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface shadow-xs">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* Search Bar Trigger */}
        <div
          onClick={() => setIsSearchOpen(true)}
          className="relative flex-1 max-w-xs sm:max-w-sm md:max-w-md cursor-pointer group"
          title="Search documents, files, folders... (Ctrl+K)"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400 group-hover:text-ink-600 transition-colors" />
          <input
            type="search"
            readOnly
            onClick={() => setIsSearchOpen(true)}
            placeholder="Search documents, files, activity… (Ctrl+K)"
            className="w-full rounded-lg border border-border bg-canvas py-1.5 sm:py-2 pl-9 pr-14 text-sm text-ink-700 placeholder:text-ink-400 focus:border-accent focus:bg-surface focus:outline-none transition-colors cursor-pointer select-none"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-mono font-medium text-ink-400 shadow-2xs">
            Ctrl+K
          </kbd>
        </div>

        {/* Real Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-1.5" aria-label="Main Navigation">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent/10 text-accent font-semibold'
                  : 'text-ink-600 hover:text-ink-900 hover:bg-canvas'
              }`
            }
            title="Dashboard"
          >
            <LayoutDashboard size={16} />
            <span className="hidden md:inline">Dashboard</span>
          </NavLink>

          <NavLink
            to="/workspaces"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent/10 text-accent font-semibold'
                  : 'text-ink-600 hover:text-ink-900 hover:bg-canvas'
              }`
            }
            title="Workspaces"
          >
            <FolderKanban size={16} />
            <span className="hidden md:inline">Workspaces</span>
          </NavLink>

          <NavLink
            to="/files"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent/10 text-accent font-semibold'
                  : 'text-ink-600 hover:text-ink-900 hover:bg-canvas'
              }`
            }
            title="Files"
          >
            <Files size={16} />
            <span className="hidden md:inline">Files</span>
          </NavLink>

          <NavLink
            to="/editor"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent/10 text-accent font-semibold'
                  : 'text-ink-600 hover:text-ink-900 hover:bg-canvas'
              }`
            }
            title="Document Editor"
          >
            <FileEdit size={16} />
            <span className="hidden md:inline">Editor</span>
          </NavLink>
        </nav>

        {/* Right Actions: Notifications & User Avatar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Interactive Notification Bell with dropdown panel */}
          {/* Interactive Notification Bell: Dropdown panel ke sath unread notifications dikhata hai */}
          <NotificationBell onNavigateToDocument={(docId) => navigate(`/editor/${docId}`)} />

          {/* User Profile Menu Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-canvas transition-colors cursor-pointer"
              aria-expanded={menuOpen}
              aria-haspopup="true"
            >
              <Avatar name={currentUser.name} imageUrl={currentUser.avatarUrl} size={32} />
              <span className="text-sm font-medium text-ink-900 hidden lg:inline">{currentUser.name}</span>
              <ChevronDown
                size={14}
                className={`text-ink-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-surface p-1.5 shadow-popover z-30">
                <div className="px-3 py-2 border-b border-border mb-1">
                  <p className="text-sm font-semibold text-ink-900 truncate">{currentUser.name}</p>
                  <p className="text-xs text-ink-400 truncate">{currentUser.email || 'Signed in'}</p>
                </div>

                <button
                  type="button"
                  onClick={handleGoToSettings}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-ink-700 hover:bg-canvas hover:text-ink-900 transition-colors text-left cursor-pointer"
                >
                  <Settings size={16} className="text-ink-400" />
                  <span>Settings</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/workspaces');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-ink-700 hover:bg-canvas hover:text-ink-900 transition-colors text-left cursor-pointer"
                >
                  <FolderKanban size={16} className="text-ink-400" />
                  <span>Workspaces</span>
                </button>

                <div className="border-t border-border my-1" />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                >
                  <LogOut size={16} className="text-red-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchBar
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectResult={handleSelectSearchResult}
      />
    </header>
  );
}

export default TopBar;