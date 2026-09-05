import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Star, Users, Activity, Clock, Plus, Share2 } from 'lucide-react';
import { getDashboard } from '../services/filesDashboardApi.js';
import { SmartBackButton } from '../../../components/SmartBackButton.jsx';

const DEFAULT_WORKSPACE_ID = 'test-workspace-1';

/**
 * StatCard Component
 *
 * English:
 * Renders an interactive statistical metric card displaying an icon, label, and numerical count.
 * Provides keyboard and click navigation support when an onClick handler is supplied.
 *
 * Roman Urdu:
 * Ye component aik interactive statistical metric card render karta hai jo icon, label aur count dikhata hai.
 * Jab onClick handler pass kiya jaye to ye mouse click aur keyboard enter par smooth navigation support deta hai.
 *
 * @param {Object} props
 * @param {React.ElementType} props.icon - Lucide icon component
 * @param {string} props.label - Card title/label
 * @param {number|string} props.value - Metric count to display
 * @param {() => void} [props.onClick] - Optional navigation callback on click
 * @returns {JSX.Element}
 */
function StatCard({ icon: Icon, label, value, onClick }) {
  const isInteractive = Boolean(onClick);
  return (
    <div
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex items-center justify-between transition-all ${
        isInteractive
          ? 'cursor-pointer hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 active:scale-[0.98]'
          : ''
      }`}
    >
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
      </div>
      <div className="bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg p-3">
        <Icon size={20} />
      </div>
    </div>
  );
}

/**
 * Formats ISO date string into human-readable relative time string.
 * English: Converts a timestamp into a relative "ago" duration.
 * Roman Urdu: Timestamp ko "m ago", "h ago" ya "d ago" jaisay readable format mein tabdeel karta hai.
 *
 * @param {string} dateStr - ISO date string
 * @returns {string} Relative time label
 */
function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/**
 * Formats activity log action into a readable description.
 * English: Translates raw activity action types into friendly descriptive sentences.
 * Roman Urdu: Activity action types ko samajh anay walay jumlay mein convert karta hai.
 *
 * @param {Object} entry - Activity log item
 * @returns {string} Human-friendly action text
 */
function activityLabel(entry) {
  const name = entry.entityName;
  switch (entry.action) {
    case 'file.uploaded': return `uploaded ${name}`;
    case 'file.renamed': return `renamed ${entry.metadata?.oldName} to ${name}`;
    case 'file.moved': return `moved ${name}`;
    case 'file.deleted': return `deleted ${name}`;
    case 'document.created': return `created ${name}`;
    case 'document.updated': return `updated ${name}`;
    case 'document.favorite_toggled': return `${entry.metadata?.isFavorited ? 'favorited' : 'unfavorited'} ${name}`;
    case 'document.archived': return `archived ${name}`;
    case 'document.restored': return `restored ${name}`;
    default: return `updated ${name}`;
  }
}

/**
 * DashboardPage Component
 *
 * English:
 * Main workspace dashboard page providing overview metrics, recent documents, recent activity logs,
 * quick document creation, and smooth navigation to Files and Workspaces modules with complete dark mode support.
 *
 * Roman Urdu:
 * Main workspace dashboard page jo key metrics, haliya documents, haliya activities, naya document banane ka button,
 * aur Files/Workspaces modules ke darmiyan navigation provide karta hai complete dark mode support ke sath.
 *
 * @param {Object} props
 * @param {string} [props.workspaceId='test-workspace-1'] - Active workspace identifier
 * @returns {JSX.Element}
 */
export default function DashboardPage({ workspaceId = DEFAULT_WORKSPACE_ID }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Authenticated user state for personalized greeting and display
  // Dynamic user profile state jo localStorage aur custom events se sync rehti hai
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  });

  useEffect(() => {
    const handleProfileUpdate = (e) => {
      if (e?.detail) {
        setCurrentUser(e.detail);
      } else {
        try {
          const raw = localStorage.getItem('user');
          if (raw) setCurrentUser(JSON.parse(raw));
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

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getDashboard(workspaceId).then((res) => {
      if (cancelled) return;
      if (res.ok) {
        setData(res.data.data);
        setError(null);
      } else {
        setError(res.error || 'Failed to load dashboard');
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-md w-48 mb-2" />
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-72 mb-8" />

        {/* Metric Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 flex justify-between items-center shadow-xs"
            >
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20" />
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-12" />
              </div>
              <div className="h-10 w-10 bg-slate-100 dark:bg-slate-700 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Main Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-36 mb-3" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 shadow-xs"
                />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-32 mb-3" />
            <div className="h-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl shadow-xs" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4 text-red-600 dark:text-red-400">
          Couldn't load dashboard: {error}
        </div>
      </div>
    );
  }

  const { recentDocuments = [], myDocuments = [], sharedWithMe = [], favorites = [], workspaces = [], recentActivity = [] } = data || {};

  const handleCreateDocument = () => {
    navigate('/editor');
  };

  const handleOpenDocument = (docId) => {
    navigate(`/editor/${docId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <SmartBackButton fallbackPath="/workspaces" title="Back to Workspaces" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Welcome back{currentUser?.name ? `, ${currentUser.name}` : ''}. Here's what's happening in your workspace.
              </p>
            </div>
          </div>
          <button
            onClick={handleCreateDocument}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus size={18} />
            <span>New Document</span>
          </button>
        </div>

        {/* Interactive Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard
            icon={FileText}
            label="My Documents"
            value={myDocuments.length}
            onClick={() => navigate('/files')}
          />
          <StatCard
            icon={Share2}
            label="Shared with Me"
            value={sharedWithMe.length}
            onClick={() => navigate('/files?filter=shared')}
          />
          <StatCard
            icon={Star}
            label="Favorites"
            value={favorites.length}
            onClick={() => navigate('/files?filter=favorites')}
          />
          <StatCard
            icon={Users}
            label="Workspaces"
            value={workspaces.length}
            onClick={() => navigate('/workspaces')}
          />
          <StatCard
            icon={Activity}
            label="Recent Activity"
            value={recentActivity.length}
          />
        </div>

        {/* Content Grids: Recent Documents, Shared with Me & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Documents</h2>
              {recentDocuments.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500">No documents yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentDocuments.map((doc) => (
                    <div
                      key={doc._id}
                      onClick={() => handleOpenDocument(doc._id)}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg p-2 shrink-0">
                          <FileText size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{doc.title}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock size={12} /> {timeAgo(doc.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Shared with Me</h2>
              {sharedWithMe.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500">No documents have been shared with you yet.</p>
              ) : (
                <div className="space-y-3">
                  {sharedWithMe.map((doc) => (
                    <div
                      key={doc._id}
                      onClick={() => handleOpenDocument(doc._id)}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg p-2 shrink-0">
                          <Share2 size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{doc.title}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock size={12} /> {timeAgo(doc.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Activity</h2>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500">No recent activity.</p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((entry) => (
                  <div key={entry._id} className="text-sm">
                    <p className="text-slate-700 dark:text-slate-300">{activityLabel(entry)}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{timeAgo(entry.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}