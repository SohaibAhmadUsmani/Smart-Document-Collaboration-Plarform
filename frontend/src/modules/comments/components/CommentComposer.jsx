import React, { useState, useRef, useCallback, useEffect } from 'react';
import { workspaceApi } from '../../workspaces/api/workspaceApi';

/**
 * Reusable comment input component for creating comments and replies.
 * Manages local input state, @mention autocomplete, and delegates submission via callback.
 *
 * @param {Object} props
 * @param {Function} props.onSubmit - Called with { body, mentions } on submit
 * @param {string} [props.workspaceId] - Workspace ID to fetch members for @mentions
 * @param {Array} [props.members] - Optional predefined members list for @mentions
 * @param {boolean} [props.isSubmitting=false] - Disables input during submission
 * @param {string} [props.placeholder='Write a comment...'] - Input placeholder
 * @param {string} [props.cancelLabel='Cancel'] - Cancel button label
 * @param {string} [props.submitLabel='Comment'] - Submit button label
 * @param {boolean} [props.showCancel=true] - Whether to show cancel button
 * @param {Function} [props.onCancel] - Called when cancel is clicked
 */
export function CommentComposer({
  onSubmit,
  workspaceId,
  members: initialMembers,
  isSubmitting = false,
  placeholder = 'Write a comment... (Type @ to mention)',
  cancelLabel = 'Cancel',
  submitLabel = 'Comment',
  showCancel = true,
  onCancel,
}) {
  const [body, setBody] = useState('');
  const [availableMembers, setAvailableMembers] = useState(initialMembers || []);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [selectedUsers, setSelectedUsers] = useState(new Map());
  const textareaRef = useRef(null);

  // Fetch workspace members if workspaceId provided and initialMembers not passed
  useEffect(() => {
    if (initialMembers && initialMembers.length > 0) {
      setAvailableMembers(initialMembers);
      return;
    }
    if (!workspaceId) return;

    let isMounted = true;
    workspaceApi.listMembers(workspaceId)
      .then((res) => {
        if (!isMounted) return;
        const list = res?.members || res?.data?.members || (Array.isArray(res) ? res : []);
        const normalized = list.map((m) => ({
          id: String(m.user?._id || m.user?.id || (typeof m.user === 'string' ? m.user : m._id || '')),
          name: m.user?.name || m.displayName || m.user?.email || 'Collaborator',
          email: m.user?.email || '',
        })).filter((m) => m.id);
        setAvailableMembers(normalized);
      })
      .catch(() => {
        // Fallback gracefully on offline / error
      });

    return () => {
      isMounted = false;
    };
  }, [workspaceId, initialMembers]);

  // Compute filtered suggestions based on current mentionQuery
  const filteredSuggestions = mentionQuery !== null
    ? availableMembers.filter((m) =>
        m.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(mentionQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  // Detect @mention trigger from text and cursor position
  const checkForMention = useCallback((text, cursorPos) => {
    const textBeforeCursor = text.slice(0, cursorPos);
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_\s]{0,20})$/);
    if (match) {
      const query = match[1];
      // Don't trigger if preceded by an email-like character without space
      const triggerIndex = textBeforeCursor.lastIndexOf('@');
      if (triggerIndex === 0 || /\s/.test(textBeforeCursor[triggerIndex - 1])) {
        setMentionQuery(query);
        setMentionStartIndex(triggerIndex);
        setSelectedSuggestionIndex(0);
        return;
      }
    }
    setMentionQuery(null);
    setMentionStartIndex(-1);
  }, []);

  const handleTextChange = (e) => {
    const newText = e.target.value;
    setBody(newText);
    checkForMention(newText, e.target.selectionStart);
  };

  const handleSelectMention = useCallback(
    (member) => {
      if (mentionStartIndex < 0) return;
      const before = body.slice(0, mentionStartIndex);
      const after = body.slice(textareaRef.current?.selectionStart || body.length);
      const mentionTag = `@${member.name} `;
      const nextBody = before + mentionTag + after;

      setBody(nextBody);
      setSelectedUsers((prev) => new Map(prev).set(member.name, member.id));
      setMentionQuery(null);
      setMentionStartIndex(-1);

      // Restore focus and cursor position after inserted mention
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const nextCursor = before.length + mentionTag.length;
          textareaRef.current.setSelectionRange(nextCursor, nextCursor);
        }
      }, 0);
    },
    [body, mentionStartIndex]
  );

  const handleSubmit = useCallback(
    async (e) => {
      e?.preventDefault?.();
      const trimmed = body.trim();
      if (!trimmed || isSubmitting) return;

      // Scan body for any @Name mentions and resolve their user IDs
      const mentionIds = new Set();
      for (const [name, id] of selectedUsers.entries()) {
        if (trimmed.includes(`@${name}`)) {
          mentionIds.add(id);
        }
      }
      // Also match against availableMembers in case user typed exact name
      for (const member of availableMembers) {
        if (trimmed.includes(`@${member.name}`)) {
          mentionIds.add(member.id);
        }
      }

      try {
        await onSubmit({
          body: trimmed,
          mentions: Array.from(mentionIds),
        });
        setBody('');
        setSelectedUsers(new Map());
        setMentionQuery(null);
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      } catch {
        // Handled by parent
      }
    },
    [body, isSubmitting, onSubmit, selectedUsers, availableMembers]
  );

  const handleCancel = useCallback(() => {
    setBody('');
    setSelectedUsers(new Map());
    setMentionQuery(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    if (onCancel) onCancel();
  }, [onCancel]);

  const handleKeyDown = useCallback(
    (e) => {
      // Mention suggestions keyboard navigation
      if (mentionQuery !== null && filteredSuggestions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedSuggestionIndex((prev) => (prev + 1) % filteredSuggestions.length);
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedSuggestionIndex((prev) => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
          return;
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          const member = filteredSuggestions[selectedSuggestionIndex];
          if (member) {
            handleSelectMention(member);
            return;
          }
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          setMentionQuery(null);
          return;
        }
      }

      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [mentionQuery, filteredSuggestions, selectedSuggestionIndex, handleSelectMention, handleSubmit]
  );

  const handleInput = useCallback((e) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, []);

  const hasBody = body.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="comment-composer relative">
      {/* Mention autocomplete suggestions popover */}
      {mentionQuery !== null && filteredSuggestions.length > 0 && (
        <div
          role="listbox"
          aria-label="Mention members"
          className="absolute bottom-full mb-1 left-0 z-50 w-64 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-800"
        >
          <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Mention Member
          </div>
          {filteredSuggestions.map((member, index) => {
            const isSelected = index === selectedSuggestionIndex;
            return (
              <button
                key={member.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelectMention(member)}
                className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors ${
                  isSelected
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white flex-shrink-0">
                  {member.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1 truncate">
                  <div className="font-semibold truncate">{member.name}</div>
                  {member.email && (
                    <div className="text-[10px] text-slate-400 truncate">{member.email}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={body}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        placeholder={placeholder}
        rows={2}
        disabled={isSubmitting}
        className="w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          {hasBody ? 'Ctrl+Enter to submit • @ to mention' : 'Type @ to mention'}
        </span>
        <div className="flex items-center gap-2">
          {showCancel && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !hasBody}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {isSubmitting ? 'Submitting...' : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
