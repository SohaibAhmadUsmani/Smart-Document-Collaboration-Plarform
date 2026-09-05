/**
 * @file CollaborationSidebar.jsx
 * @description Accessible, collapsible right-hand collaboration and history sidebar component.
 * Features tabs for comments, real-time collaborator list, and version history.
 * @module frontend/src/modules/editor/components/CollaborationSidebar
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh right sidebar component hai jisme 3 tabs shamil hain:
 * 1. Comments: Discussion threads, reply box, aur resolve action (Ayyan ke module ke sath synced)
 * 2. Collaborators: Live active users, their roles, aur presence indicators
 * 3. History: Document ke previous versions aur snapshot checkpoints
 */

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Users,
  History,
  Check,
  CornerDownRight,
  Send,
  MoreHorizontal,
  ChevronRight,
  ChevronLeft,
  X,
} from 'lucide-react';

/**
 * CollaborationSidebar Component (DocSync Pro Collaboration Panel).
 *
 * [ROMAN URDU]:
 * Right collaboration panel component.
 *
 * @param {Object} props
 * @param {string|null} [props.activeThreadId=null] - ID of highlighted comment thread
 * @param {Function} [props.onResolveComment] - Handler when a comment is resolved
 * @param {Function} [props.onAddComment] - Handler when a new comment is posted
 * @param {Function} [props.onCommentClick] - Handler when a comment card is clicked (jumps to anchor)
 * @returns {React.JSX.Element}
 */
export function CollaborationSidebar({
  activeThreadId = null,
  onResolveComment,
  onAddComment,
  onCommentClick,
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('comments');
  const [comments, setComments] = useState([]);
  const [replyInputs, setReplyInputs] = useState({});
  const [newCommentInput, setNewCommentInput] = useState('');

  // Auto-expand sidebar if a specific comment thread was selected
  useEffect(() => {
    if (activeThreadId) {
      setIsOpen(true);
      setActiveTab('comments');
    }
  }, [activeThreadId]);

  const handleResolve = (id, e) => {
    e.stopPropagation();
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, resolved: !c.resolved } : c))
    );
    if (onResolveComment) {
      onResolveComment(id);
    }
  };

  const handleSendReply = (commentId) => {
    const text = replyInputs[commentId]?.trim();
    if (!text) return;

    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const replies = c.replies || [];
          return {
            ...c,
            replies: [
              ...replies,
              {
                id: `rep_${Date.now()}`,
                author: { name: 'User', avatar: '' },
                body: text,
                timestamp: 'Just now',
              },
            ],
          };
        }
        return c;
      })
    );

    setReplyInputs((prev) => ({ ...prev, [commentId]: '' }));
  };

  const handlePostNewComment = () => {
    if (!newCommentInput.trim()) return;

    const newComment = {
      id: `cmt_${Date.now()}`,
      author: { name: 'User', avatar: '' },
      body: newCommentInput.trim(),
      timestamp: 'Just now',
      createdAt: new Date().toISOString(),
      resolved: false,
      replies: [],
      anchor: {
        exactQuote: 'General Document Discussion',
      },
    };

    setComments((prev) => [newComment, ...prev]);
    setNewCommentInput('');
    if (onAddComment) {
      onAddComment(newComment);
    }
  };

  if (!isOpen) {
    return (
      <aside
        aria-label="Collaboration sidebar (collapsed)"
        className="fixed right-0 top-32 z-30 flex items-center"
      >
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-expanded={false}
          aria-label="Open Collaboration Sidebar"
          className="h-10 px-2 rounded-l-xl bg-white dark:bg-slate-800 border-l border-y border-slate-200 dark:border-slate-700 shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </button>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Collaboration and Version History Sidebar"
      className="w-80 sm:w-88 flex-shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-[calc(100vh-108px)] sticky top-28 z-20 select-none shadow-sm transition-all duration-200"
    >
      {/* 1. Header with Tabs and Close Button */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div
          role="tablist"
          aria-label="Sidebar navigation"
          className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'comments'}
            onClick={() => setActiveTab('comments')}
            className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'comments'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Comments</span>
            <span className="text-[10px] px-1 py-0.2 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full font-mono">
              {comments.filter((c) => !c.resolved).length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'collaborators'}
            onClick={() => setActiveTab('collaborators')}
            className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'collaborators'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'history'}
            onClick={() => setActiveTab('history')}
            className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Collapse sidebar"
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Tab Content Panels */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Comments Tab Panel */}
        {activeTab === 'comments' && (
          <div className="space-y-3">
            {/* New Comment Input Box */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 shadow-2xs">
              <textarea
                value={newCommentInput}
                onChange={(e) => setNewCommentInput(e.target.value)}
                placeholder="Leave a comment or question..."
                rows={2}
                aria-label="Comment message"
                className="w-full text-xs bg-transparent border-none outline-none resize-none placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-slate-100"
              />
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] text-slate-400">Attach to document</span>
                <button
                  type="button"
                  onClick={handlePostNewComment}
                  disabled={!newCommentInput.trim()}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  <Send className="w-3 h-3" /> Post
                </button>
              </div>
            </div>

            {/* Comment Threads List */}
            {comments.map((comment) => {
              const isTargeted = activeThreadId === comment.id;
              return (
                <div
                  key={comment.id}
                  onClick={() => onCommentClick && onCommentClick(comment)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    comment.resolved
                      ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/50 opacity-60'
                      : isTargeted
                      ? 'bg-blue-50/40 dark:bg-blue-950/30 border-blue-400 ring-2 ring-blue-400/20'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs'
                  }`}
                >
                  {/* Anchor quote if text selection comment */}
                  {comment.anchor?.exactQuote && (
                    <div className="mb-2 pl-2 border-l-2 border-amber-400 text-[11px] font-serif text-slate-600 dark:text-slate-400 italic line-clamp-1 bg-amber-50/40 dark:bg-amber-950/20 py-0.5 rounded-r">
                      "{comment.anchor.exactQuote}"
                    </div>
                  )}

                  {/* Comment Author Header */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <img
                        src={comment.author?.avatar}
                        alt={comment.author?.name}
                        className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200"
                      />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {comment.author?.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {comment.timestamp}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleResolve(comment.id, e)}
                        className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                          comment.resolved ? 'text-emerald-600 font-bold' : 'text-slate-400'
                        }`}
                        title={comment.resolved ? 'Reopen thread' : 'Resolve thread'}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Comment Body */}
                  <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                    {comment.body}
                  </p>

                  {/* Nested Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-2">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex items-start gap-2 pl-2 text-xs">
                          <CornerDownRight className="w-3 h-3 text-slate-300 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                                {reply.author?.name}
                              </span>
                              <span className="text-[9px] text-slate-400">{reply.timestamp}</span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                              {reply.body}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inline Reply Input */}
                  {!comment.resolved && (
                    <div className="mt-2.5 flex items-center gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-700/40">
                      <input
                        type="text"
                        value={replyInputs[comment.id] || ''}
                        onChange={(e) =>
                          setReplyInputs({ ...replyInputs, [comment.id]: e.target.value })
                        }
                        onKeyDown={(e) => e.key === 'Enter' && handleSendReply(comment.id)}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Reply..."
                        aria-label="Reply to comment"
                        className="flex-1 text-[11px] bg-slate-50 dark:bg-slate-800/80 rounded px-2 py-1 outline-none border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendReply(comment.id);
                        }}
                        disabled={!replyInputs[comment.id]?.trim()}
                        className="p-1 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-30 text-white"
                      >
                        <Send className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Collaborators Tab Panel */}
        {activeTab === 'collaborators' && (
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
              Active in this Document
            </span>
            {([]).map((collab) => (
              <div
                key={collab.id}
                className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <img
                      src={collab.avatar}
                      alt={collab.name}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-100"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-800 ${
                        collab.status === 'editing'
                          ? 'bg-emerald-500'
                          : collab.status === 'viewing'
                          ? 'bg-blue-500'
                          : 'bg-amber-400'
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {collab.name}
                    </p>
                    <p className="text-[10px] text-slate-400 capitalize">
                      {collab.status} • {collab.role}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-400">{collab.lastActive}</span>
              </div>
            ))}
          </div>
        )}

        {/* History Tab Panel */}
        {activeTab === 'history' && (
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
              Version Snapshots
            </span>
            {([]).map((hist) => (
              <div
                key={hist.id}
                className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-blue-400 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    Version {hist.version}.0
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{hist.timestamp}</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  {hist.summary}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <img
                    src={hist.author.avatar}
                    alt={hist.author.name}
                    className="w-4 h-4 rounded-full object-cover"
                  />
                  <span className="text-[10px] text-slate-400">{hist.author.name}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

export default CollaborationSidebar;
