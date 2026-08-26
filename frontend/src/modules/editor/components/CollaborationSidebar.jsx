import React, { useState } from 'react';
import {
  MessageSquare,
  History,
  MoreHorizontal,
  MessageSquarePlus,
  AlertCircle,
  ChevronRight,
  Check,
  Send,
  X,
  MessageSquareCheck,
} from 'lucide-react';
import { MOCK_COMMENTS, MOCK_HISTORY, MOCK_CURRENT_USER } from '../services/mockData.js';

export function CollaborationSidebar({
  activeThreadId = null,
  onResolveComment,
  onAddComment,
  onCommentClick,
}) {
  const [activeTab, setActiveTab] = useState('comments'); // 'comments' | 'history'
  const [comments, setComments] = useState(MOCK_COMMENTS);
  const [replyInputThreadId, setReplyInputThreadId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [newGlobalCommentText, setNewGlobalCommentText] = useState('');
  const [showGlobalInput, setShowGlobalInput] = useState(false);

  const handleResolve = (commentId) => {
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, resolved: true } : c))
    );
    if (onResolveComment) {
      onResolveComment(commentId);
    }
  };

  const handleAddReply = (commentId) => {
    if (!replyText.trim()) return;

    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          return {
            ...c,
            replies: [
              ...c.replies,
              {
                id: `rep_${Date.now()}`,
                author: MOCK_CURRENT_USER,
                body: replyText.trim(),
                timestamp: 'Just now',
              },
            ],
          };
        }
        return c;
      })
    );
    setReplyText('');
    setReplyInputThreadId(null);
  };

  const handleCreateGlobalComment = () => {
    if (!newGlobalCommentText.trim()) return;

    const newCmt = {
      id: `cmt_${Date.now()}`,
      author: MOCK_CURRENT_USER,
      timestamp: 'Just now',
      createdAt: new Date().toISOString(),
      body: newGlobalCommentText.trim(),
      resolved: false,
      replies: [],
    };

    setComments((prev) => [newCmt, ...prev]);
    setNewGlobalCommentText('');
    setShowGlobalInput(false);
    if (onAddComment) {
      onAddComment(newCmt);
    }
  };

  const activeComments = comments.filter((c) => !c.resolved);

  return (
    <aside className="w-88 flex-shrink-0 flex flex-col justify-between border-l border-slate-200 bg-white sticky top-12 h-[calc(100vh-48px)] overflow-hidden select-none">
      {/* 1. Header Segmented Tabs (COMMENTS vs HISTORY) */}
      <div>
        <div className="h-13 border-b border-slate-200 px-4 flex items-center gap-2 bg-slate-50/70">
          <button
            type="button"
            onClick={() => setActiveTab('comments')}
            className={`flex-1 h-8.5 flex items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'comments'
                ? 'bg-white border border-slate-200/90 text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span>COMMENTS</span>
            {activeComments.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-blue-50 text-[10px] text-blue-700 rounded-full font-mono font-bold">
                {activeComments.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 h-8.5 flex items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-white border border-slate-200/90 text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
            }`}
          >
            <History className="w-4 h-4 text-slate-500" />
            <span>HISTORY</span>
          </button>
        </div>

        {/* 2. Body Stream */}
        <div className="overflow-y-auto p-4 space-y-3.5 max-h-[calc(100vh-210px)]">
          {activeTab === 'comments' ? (
            <>
              {/* Section Header */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                  ACTIVE THREADS
                </span>
                <button type="button" className="text-slate-400 hover:text-slate-600">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

              {activeComments.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <MessageSquareCheck className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-600">All comments resolved!</p>
                  <p className="text-[11px] text-slate-400">Highlight text in the editor to start a new thread.</p>
                </div>
              ) : (
                /* Thread Cards List */
                activeComments.map((comment) => (
                  <div
                    key={comment.id}
                    onClick={() => onCommentClick && onCommentClick(comment)}
                    className={`p-3.5 rounded-xl border bg-white transition-all space-y-2.5 cursor-pointer ${
                      activeThreadId === comment.id
                        ? 'border-blue-500 ring-3 ring-blue-50 shadow-sm'
                        : 'border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-xs'
                    }`}
                  >
                    {/* Author Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={comment.author.avatar}
                          alt={comment.author.name}
                          className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-100"
                        />
                        <span className="text-xs font-bold text-slate-900">
                          {comment.author.name}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {comment.timestamp}
                      </span>
                    </div>

                    {/* Anchored Quote Context if present */}
                    {comment.anchor?.exactQuote && (
                      <div className="bg-amber-50/80 border-l-2 border-amber-400 px-2.5 py-1 text-[11.5px] text-amber-900 rounded-r font-medium italic">
                        "{comment.anchor.exactQuote}"
                      </div>
                    )}

                    {/* Comment Body */}
                    <p className="text-xs text-slate-800 leading-relaxed">
                      {comment.body}
                    </p>

                    {/* Nested Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="pl-3 border-l-2 border-slate-100 space-y-2 mt-2 pt-1">
                        {comment.replies.map((rep) => (
                          <div key={rep.id} className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <img
                                src={rep.author.avatar}
                                alt={rep.author.name}
                                className="w-4 h-4 rounded-full object-cover"
                              />
                              <span className="text-[11px] font-semibold text-slate-800">
                                {rep.author.name}
                              </span>
                              <span className="text-[10px] text-slate-400 ml-auto font-mono">
                                {rep.timestamp}
                              </span>
                            </div>
                            <p className="text-[11.5px] text-slate-700 pl-5.5 leading-normal">
                              {rep.body}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply Input Form */}
                    {replyInputThreadId === comment.id ? (
                      <div className="pt-2 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write a reply..."
                          className="flex-1 h-7.5 px-2.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddReply(comment.id);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleAddReply(comment.id)}
                          className="h-7.5 px-2.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 font-semibold flex items-center justify-center"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setReplyInputThreadId(null)}
                          className="h-7.5 px-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      /* Thread Actions */
                      <div className="flex items-center gap-3 pt-1 text-xs">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReplyInputThreadId(comment.id);
                          }}
                          className="font-semibold text-blue-600 hover:underline cursor-pointer"
                        >
                          Reply
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResolve(comment.id);
                          }}
                          className="font-medium text-slate-500 hover:text-emerald-600 cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Resolve</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* Add Global Comment */}
              {showGlobalInput ? (
                <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2.5">
                  <textarea
                    value={newGlobalCommentText}
                    onChange={(e) => setNewGlobalCommentText(e.target.value)}
                    placeholder="Type a global comment or mention someone with @..."
                    rows={3}
                    className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 resize-none"
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowGlobalInput(false)}
                      className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateGlobalComment}
                      className="px-3.5 py-1 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-xs"
                    >
                      Comment
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowGlobalInput(true)}
                  className="w-full p-3 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 bg-slate-50/60 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <MessageSquarePlus className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-600">
                    Add a global comment...
                  </span>
                </button>
              )}
            </>
          ) : (
            /* Version History Stream */
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                  SAVED VERSIONS
                </span>
              </div>
              {MOCK_HISTORY.map((ver) => (
                <div
                  key={ver.id}
                  className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all space-y-1.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold">
                        v{ver.version}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {ver.author.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {ver.timestamp}
                    </span>
                  </div>
                  <p className="text-[11.5px] text-slate-600 leading-snug">
                    {ver.summary}
                  </p>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => alert(`Previewing milestone version ${ver.version}`)}
                      className="text-xs text-blue-600 hover:underline font-semibold"
                    >
                      Restore this version
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Bottom Docked Review Banner */}
      <div className="p-3.5 border-t border-slate-200 bg-slate-50/90 hover:bg-slate-100 cursor-pointer transition-colors flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-slate-700 flex-shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-900">
              Pending Review
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              2 items require your attention
            </span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400" />
      </div>
    </aside>
  );
}
