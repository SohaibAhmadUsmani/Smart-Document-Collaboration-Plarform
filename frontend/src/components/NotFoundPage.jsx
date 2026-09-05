/**
 * @file NotFoundPage.jsx
 * @description Dedicated, polished 404 Not Found Page for unmatched routes and missing resources.
 * Features DocSync Pro branding, dark-mode support, and quick action navigation.
 * @module frontend/src/components/NotFoundPage
 */

import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FileQuestion, Home, FolderKanban, Plus, ArrowLeft, Search } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex flex-col justify-between text-slate-800 dark:text-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Header Bar */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <Link
          to="/dashboard"
          className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-lg group"
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-sm shadow-sm group-hover:bg-blue-700 transition-colors">
            📄
          </span>
          <span className="tracking-tight">DocSync Pro</span>
        </Link>

        <button
          onClick={handleGoBack}
          className="inline-flex items-center text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors gap-1.5"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
      </header>

      {/* Main 404 Hero Section */}
      <main className="max-w-2xl w-full mx-auto my-auto text-center py-12 flex flex-col items-center">
        {/* Visual Badge / Icon */}
        <div className="relative mb-6">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xl shadow-blue-500/5 animate-pulse">
            <FileQuestion size={48} strokeWidth={1.75} />
          </div>
          <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider uppercase bg-amber-500 text-white shadow">
            404
          </span>
        </div>

        {/* Large Decorative 404 Numbers */}
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
          Page Not Found
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-lg mb-8 leading-relaxed">
          The page, document, or workspace you are trying to reach doesn't exist, has been moved, or you might not have access permissions.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition-all hover:shadow-lg active:scale-95"
          >
            <Home size={16} />
            <span>Go to Dashboard</span>
          </Link>

          <Link
            to="/workspaces"
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-sm font-semibold shadow-sm transition-all active:scale-95"
          >
            <FolderKanban size={16} />
            <span>Browse Workspaces</span>
          </Link>
        </div>

        {/* Quick Links Row */}
        <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-slate-800/80 w-full flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
          <Link
            to="/editor"
            className="inline-flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
          >
            <Plus size={14} />
            <span>New Document</span>
          </Link>

          <Link
            to="/files"
            className="inline-flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
          >
            <Search size={14} />
            <span>All Files</span>
          </Link>

          <button
            onClick={handleGoBack}
            className="inline-flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
          >
            <ArrowLeft size={14} />
            <span>Go Back Previous Page</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto text-center text-xs text-slate-400 dark:text-slate-500">
        <p>DocSync Pro © {new Date().getFullYear()} — Enterprise Collaborative Document Platform</p>
      </footer>
    </div>
  );
}

export default NotFoundPage;
