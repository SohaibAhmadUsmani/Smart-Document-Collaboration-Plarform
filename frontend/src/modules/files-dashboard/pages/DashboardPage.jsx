import React, { useEffect, useState } from 'react';
import { FileText, Star, Users, Activity, Clock } from 'lucide-react';
import { getDashboard } from '../services/filesDashboardApi.js';

const DEFAULT_WORKSPACE_ID = 'test-workspace-1';

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      </div>
      <div className="bg-blue-50 text-blue-600 rounded-lg p-3">
        <Icon size={20} />
      </div>
    </div>
  );
}

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

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

export default function DashboardPage({ workspaceId = DEFAULT_WORKSPACE_ID }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    return <div className="p-8 text-slate-500">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">Couldn't load dashboard: {error}</div>;
  }

  const { recentDocuments, myDocuments, favorites, workspaces, recentActivity } = data;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome back. Here's what's happening in your workspace.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FileText} label="My Documents" value={myDocuments.length} />
        <StatCard icon={Star} label="Favorites" value={favorites.length} />
        <StatCard icon={Users} label="Workspaces" value={workspaces.length} />
        <StatCard icon={Activity} label="Recent Activity" value={recentActivity.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Documents</h2>
          {recentDocuments.length === 0 ? (
            <p className="text-sm text-slate-400">No documents yet.</p>
          ) : (
            <div className="space-y-3">
              {recentDocuments.map((doc) => (
                <div key={doc._id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-100 text-slate-500 rounded-lg p-2">
                      <FileText size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{doc.title}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock size={12} /> {timeAgo(doc.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-slate-400">No recent activity.</p>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((entry) => (
                <div key={entry._id} className="text-sm">
                  <p className="text-slate-700">{activityLabel(entry)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{timeAgo(entry.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}