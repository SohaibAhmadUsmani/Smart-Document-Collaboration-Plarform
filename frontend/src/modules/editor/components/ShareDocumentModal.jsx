/**
 * @file ShareDocumentModal.jsx
 * @description Production-ready modal dialog for managing document sharing, collaborator invitations, and permission controls.
 * Document share karne, naye sathiyon (collaborators) ko dawat dene aur permissions control karne ka modal dialog.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Globe,
  Lock,
  Mail,
  Users,
  Building,
} from 'lucide-react';
import {
  apiGetDocumentPermissions,
  apiInviteCollaborator,
  apiRemoveCollaborator,
  apiUpdateSharingMode,
} from '../services/documentApi';

/**
 * @typedef {'viewer' | 'commenter' | 'editor'} ShareRole
 */

/**
 * ShareDocumentModal Component
 *
 * English:
 * Provides an interactive interface for copying shareable document links, inviting collaborators by email,
 * adjusting permission levels (Viewer, Commenter, Editor), and managing general access visibility.
 *
 * Roman Urdu:
 * Document ka shareable link copy karne, email ke zariye sathiyon ko dawat dene,
 * aur permissions (Viewer, Commenter, Editor) set karne ke liye mukammal interactive modal faraham karta hai.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open / Kya modal khula hai
 * @param {() => void} props.onClose - Callback to close modal / Modal band karne ka function
 * @param {string} props.documentTitle - Title of current document / Document ka unwaan
 * @param {string} [props.documentId] - Unique ID of document / Document ki shanakht
 * @param {string} [props.workspaceName] - Name of associated workspace / Mutalliqa workspace ka naam
 * @returns {React.ReactElement | null}
 */
export function ShareDocumentModal({
  isOpen,
  onClose,
  documentTitle = 'Untitled Document',
  documentId = '',
  workspaceName = 'General Workspace',
}) {
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [generalAccess, setGeneralAccess] = useState('workspace');
  const [shareToken, setShareToken] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [collaborators, setCollaborators] = useState([]);

  // Load permissions when modal opens
  useEffect(() => {
    let isMounted = true;
    async function loadPermissions() {
      if (!isOpen || !documentId) return;
      setIsLoading(true);
      setErrorMessage('');
      try {
        const data = await apiGetDocumentPermissions(documentId);
        if (isMounted) {
          setCollaborators(data.collaborators || []);
          setGeneralAccess(data.sharingMode || 'workspace');
          setShareToken(data.shareToken || null);
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Could not load permissions from API:', err.message);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadPermissions();
    return () => {
      isMounted = false;
    };
  }, [isOpen, documentId]);

  // Calculate canonical share URL
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/editor/${documentId || ''}${shareToken ? `?token=${shareToken}` : ''}`
    : `https://docsync.pro/editor/${documentId || ''}`;

  // Keyboard shortcut listener to close on Escape
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  /**
   * Copies document link to system clipboard with user confirmation.
   */
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setFeedback('Link copied to clipboard!');
      setTimeout(() => {
        setCopied(false);
        setFeedback('');
      }, 2500);
    } catch (err) {
      setFeedback('Failed to copy link. Please copy manually.');
    }
  };

  /**
   * Handles collaborator invitation submission.
   */
  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !documentId) return;

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const newCollab = await apiInviteCollaborator(documentId, inviteEmail.trim(), inviteRole);
      setCollaborators((prev) => {
        const filtered = prev.filter((c) => c.email.toLowerCase() !== inviteEmail.trim().toLowerCase());
        return [...filtered, newCollab];
      });
      setInviteEmail('');
      setFeedback(`Invitation sent to ${inviteEmail}!`);
      setTimeout(() => setFeedback(''), 3000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to invite collaborator');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Removes collaborator from active document access list.
   */
  const handleRemoveCollaborator = async (id) => {
    try {
      await apiRemoveCollaborator(documentId, id);
      setCollaborators((prev) => prev.filter((c) => c.id !== id));
      setFeedback('Collaborator removed.');
      setTimeout(() => setFeedback(''), 2500);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to remove collaborator');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  /**
   * Updates general access sharing mode.
   */
  const handleGeneralAccessChange = async (newMode) => {
    setGeneralAccess(newMode);
    try {
      const result = await apiUpdateSharingMode(documentId, newMode);
      if (result.shareToken) {
        setShareToken(result.shareToken);
      }
      setFeedback(`Sharing mode updated to: ${newMode}`);
      setTimeout(() => setFeedback(''), 2500);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update sharing mode');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 id="share-modal-title" className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Share "{documentTitle}"
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Workspace: <span className="font-semibold text-slate-700 dark:text-slate-300">{workspaceName}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close share modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="px-6 py-2 bg-emerald-50 dark:bg-emerald-950/30 border-b border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="px-6 py-2 bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-800 text-xs font-medium text-red-800 dark:text-red-300 flex items-center gap-2">
            <X className="w-3.5 h-3.5 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* 1. Invite by Email Form */}
          <form onSubmit={handleInvite} className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Invite by Email
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="collaborator@company.com"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                />
              </div>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="py-2 px-2.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              >
                <option value="editor">Can edit</option>
                <option value="commenter">Can comment</option>
                <option value="viewer">Can view</option>
              </select>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer shrink-0"
              >
                {isSubmitting ? 'Sending...' : 'Invite'}
              </button>
            </div>
          </form>

          {/* 2. Active Collaborators List */}
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              People with Access ({collaborators.length})
            </label>
            <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl">
              {isLoading ? (
                <div className="p-4 text-center text-xs text-slate-400">Loading collaborators...</div>
              ) : collaborators.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">No collaborators added yet.</div>
              ) : (
                collaborators.map((collab) => (
                  <div key={collab.id || collab.userId || collab.email} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                        {collab.name ? collab.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {collab.name}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">{collab.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
                        {collab.role}
                      </span>
                      {!collab.isOwner && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCollaborator(collab.id)}
                          className="text-xs text-red-500 hover:text-red-700 p-1 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors cursor-pointer"
                          title="Remove access"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 3. General Access Setting */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                {generalAccess === 'anyone_with_link' ? (
                  <Globe className="w-4 h-4" />
                ) : generalAccess === 'workspace' ? (
                  <Building className="w-4 h-4" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {generalAccess === 'anyone_with_link'
                    ? 'Anyone with the link'
                    : generalAccess === 'workspace'
                    ? 'Workspace Members'
                    : 'Restricted (Private)'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {generalAccess === 'anyone_with_link'
                    ? 'Anyone with this link can view this document'
                    : generalAccess === 'workspace'
                    ? 'All members of this workspace can view and edit'
                    : 'Only explicitly invited collaborators can access'}
                </p>
              </div>
            </div>
            <select
              value={generalAccess}
              onChange={(e) => handleGeneralAccessChange(e.target.value)}
              className="py-1.5 px-2 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <option value="private">Private</option>
              <option value="workspace">Workspace</option>
              <option value="anyone_with_link">Anyone with link</option>
            </select>
          </div>
        </div>

        {/* Footer: Copy Link Button */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex-1 truncate text-xs text-slate-500 dark:text-slate-400 font-mono select-all bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
            {shareUrl}
          </div>
          <button
            type="button"
            onClick={handleCopyLink}
            className={`px-4 py-2 flex items-center gap-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 ${
              copied
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShareDocumentModal;
