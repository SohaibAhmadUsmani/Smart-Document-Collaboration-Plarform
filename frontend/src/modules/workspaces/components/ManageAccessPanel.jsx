import { useState } from 'react';
import { Avatar } from '../../../components/Avatar';
import { Badge } from '../../../components/Badge';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { useToast } from '../../../components/Toast';
import { RoleSelector } from './RoleSelector';
import { workspaceApi } from '../api/workspaceApi';
import { ApiError } from '../api/client';
export function ManageAccessPanel({ workspaceId, members, loading, canManage, currentUserId, onChanged, }) {
    const { showToast } = useToast();
    const [removeTarget, setRemoveTarget] = useState(null);
    const [removing, setRemoving] = useState(false);
    async function handleRoleChange(member, role) {
        try {
            await workspaceApi.changeMemberRole(workspaceId, member.user, role);
            onChanged();
        }
        catch (err) {
            showToast(err instanceof ApiError ? err.message : 'Failed to change role', 'error');
        }
    }
    async function handleRemove() {
        if (!removeTarget)
            return;
        setRemoving(true);
        try {
            await workspaceApi.removeMember(workspaceId, removeTarget.user);
            showToast(`${removeTarget.displayName ?? 'Member'} removed`);
            onChanged();
        }
        catch (err) {
            showToast(err instanceof ApiError ? err.message : 'Failed to remove member', 'error');
        }
        finally {
            setRemoving(false);
            setRemoveTarget(null);
        }
    }
    return (<div className="rounded-xl border border-border bg-surface shadow-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-ink-900">Manage Access</h3>
          <p className="text-xs text-ink-500">People with access to this workspace</p>
        </div>
      </div>

      <div>
        {loading ? ([...Array(3)].map((_, i) => (<div key={i} className="flex animate-pulse items-center gap-3 border-b border-border px-5 py-3 last:border-0">
              <div className="h-9 w-9 rounded-full bg-canvas"/>
              <div className="flex-1">
                <div className="h-3 w-32 rounded bg-canvas"/>
                <div className="mt-1.5 h-2.5 w-40 rounded bg-canvas"/>
              </div>
            </div>))) : members.length === 0 ? (<p className="px-5 py-6 text-sm text-ink-500">No members yet — invite people above.</p>) : (members.map((member) => {
            const isOwner = member.role === 'OWNER';
            const isSelf = member.user === currentUserId;
            return (<div key={member._id} className="flex items-center justify-between border-b border-border px-5 py-3 last:border-0">
                <div className="flex items-center gap-3">
                  <Avatar name={member.displayName ?? member.user} imageUrl={member.avatarUrl} size={36}/>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-ink-900">
                        {member.displayName ?? 'Workspace member'}
                      </span>
                      {isOwner && <Badge tone="purple">OWNER</Badge>}
                    </div>
                    <p className="text-xs text-ink-500">{member.email ?? member.user}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {isOwner ? (<span className="px-2 py-1 text-sm text-ink-500">Full Access</span>) : canManage ? (<RoleSelector value={member.role} onChange={(role) => handleRoleChange(member, role)}/>) : (<span className="px-2 py-1 text-sm text-ink-500">
                      {member.role.charAt(0) + member.role.slice(1).toLowerCase()}
                    </span>)}
                  {canManage && !isOwner && !isSelf && (<button type="button" aria-label={`Remove ${member.displayName ?? 'member'}`} onClick={() => setRemoveTarget(member)} className="rounded-md p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600">
                      <TrashIcon />
                    </button>)}
                </div>
              </div>);
        }))}
      </div>

      <ConfirmDialog open={Boolean(removeTarget)} title="Remove member?" description={`${removeTarget?.displayName ?? 'This member'} will lose access to the workspace immediately.`} confirmLabel="Remove" busy={removing} onConfirm={handleRemove} onCancel={() => setRemoveTarget(null)}/>
    </div>);
}
function TrashIcon() {
    return (<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16"/>
    </svg>);
}
