import { Link } from 'react-router-dom';
import { Avatar } from '../../../components/Avatar';
import { Button } from '../../../components/Button';
import { ROLE_LABELS } from '../types';
export function MembersPanel({ workspaceId, members, loading }) {
    return (<div className="rounded-xl border border-border bg-surface p-5 shadow-card">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-400">Workspace Members</h3>

      <div className="mt-3 space-y-3">
        {loading ? ([...Array(3)].map((_, i) => (<div key={i} className="flex animate-pulse items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-canvas"/>
              <div className="flex-1">
                <div className="h-3 w-24 rounded bg-canvas"/>
                <div className="mt-1.5 h-2.5 w-16 rounded bg-canvas"/>
              </div>
            </div>))) : members.length === 0 ? (<p className="text-sm text-ink-500">No members yet.</p>) : (members.slice(0, 6).map((member) => (<div key={member._id} className="flex items-center gap-3">
              <Avatar name={member.displayName ?? member.user} imageUrl={member.avatarUrl} size={36}/>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink-900">
                  {member.displayName ?? 'Workspace member'}
                </p>
                <p className="text-xs text-ink-500">{ROLE_LABELS[member.role]}</p>
              </div>
            </div>)))}
      </div>

      <Link to={`/workspaces/${workspaceId}/sharing`} className="mt-4 block">
        <Button variant="secondary" className="w-full justify-center">
          <PersonAddIcon /> Manage Access
        </Button>
      </Link>
    </div>);
}
function PersonAddIcon() {
    return (<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM20 8v6M23 11h-6"/>
    </svg>);
}
