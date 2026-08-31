import { useState } from 'react';
import { useToast } from '../../../components/Toast';
import { workspaceApi } from '../api/workspaceApi';
import { ApiError } from '../api/client';
const OPTIONS = [
    { value: 'PRIVATE', label: 'Private', description: 'Only invited members can access this workspace.' },
    {
        value: 'WORKSPACE_ONLY',
        label: 'Workspace members',
        description: 'Anyone in this workspace can access it, according to their role.',
    },
    {
        value: 'ANYONE_WITH_LINK',
        label: 'Anyone with the link',
        description: 'Anyone with the link can access it as a Viewer.',
    },
];
export function GeneralAccessCard({ workspaceId, sharing, canManage, onChanged }) {
    const { showToast } = useToast();
    const [changing, setChanging] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const shareUrl = sharing.shareToken ? `${window.location.origin}/shared/${sharing.shareToken}` : null;
    const current = OPTIONS.find((o) => o.value === sharing.visibility) ?? OPTIONS[0];
    async function handleChange(visibility) {
        setChanging(true);
        try {
            const { sharing: updated } = await workspaceApi.updateSharing(workspaceId, visibility);
            onChanged(updated);
            setExpanded(false);
        }
        catch (err) {
            showToast(err instanceof ApiError ? err.message : 'Failed to update sharing', 'error');
        }
        finally {
            setChanging(false);
        }
    }
    async function handleCopy() {
        if (!shareUrl)
            return;
        await navigator.clipboard.writeText(shareUrl);
        showToast('Link copied to clipboard');
    }
    return (<div className="rounded-xl border border-border bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <LockIcon />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-ink-900">General Access</h3>
              <span className="rounded-full bg-ink-900/5 px-2 py-0.5 text-xs font-medium text-ink-500">
                {sharing.visibility === 'PRIVATE' ? 'Restricted' : 'Shared'}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-ink-500">{current.description}</p>
          </div>
        </div>
        {canManage && (<button type="button" onClick={() => setExpanded((v) => !v)} className="text-sm font-medium text-accent hover:underline">
            Change
          </button>)}
      </div>

      {expanded && (<div className="mt-4 space-y-1 border-t border-border pt-4">
          {OPTIONS.map((option) => (<label key={option.value} className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-canvas">
              <input type="radio" name="visibility" className="mt-1" checked={sharing.visibility === option.value} disabled={changing} onChange={() => handleChange(option.value)}/>
              <span>
                <span className="block text-sm font-medium text-ink-900">{option.label}</span>
                <span className="block text-xs text-ink-500">{option.description}</span>
              </span>
            </label>))}
        </div>)}

      {shareUrl && (<div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-canvas px-3 py-2">
          <LinkIcon />
          <span className="flex-1 truncate text-sm text-ink-500">{shareUrl}</span>
          <button type="button" onClick={handleCopy} className="flex items-center gap-1.5 text-sm font-medium text-ink-700 hover:text-accent">
            <CopyIcon /> Copy Link
          </button>
        </div>)}
    </div>);
}
function LockIcon() {
    return (<svg className="mt-0.5 h-5 w-5 shrink-0 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
    </svg>);
}
function LinkIcon() {
    return (<svg className="h-4 w-4 shrink-0 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5M10.172 13.828a4 4 0 010-5.656l3-3a4 4 0 015.656 5.656l-1.5 1.5"/>
    </svg>);
}
function CopyIcon() {
    return (<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
    </svg>);
}
