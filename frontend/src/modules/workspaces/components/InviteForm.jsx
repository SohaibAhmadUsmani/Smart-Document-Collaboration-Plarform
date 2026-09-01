import { useState } from 'react';
import { Button } from '../../../components/Button';
import { workspaceApi } from '../api/workspaceApi';
import { ROLE_LABELS } from '../types';
import { ApiError } from '../api/client';
const ROLES = ['EDITOR', 'COMMENTER', 'VIEWER'];
// TODO: once the Auth/Users module exposes a lookup endpoint, this becomes
// a type-ahead that resolves an email/name to a userId. For now it accepts
// a userId directly so the flow is wired end-to-end against the real API.
export function InviteForm({ workspaceId, onInvited }) {
    const [userId, setUserId] = useState('');
    const [role, setRole] = useState('EDITOR');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    async function handleSubmit(event) {
        event.preventDefault();
        if (!userId.trim()) {
            setError('Enter a user ID to invite');
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            await workspaceApi.addMember(workspaceId, { userId: userId.trim(), role });
            setUserId('');
            onInvited();
        }
        catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to add member');
        }
        finally {
            setSubmitting(false);
        }
    }
    return (<form onSubmit={handleSubmit} className="rounded-xl border border-border bg-surface p-5 shadow-card">
      <h3 className="text-sm font-semibold text-ink-900">Invite People</h3>
      <div className="mt-3 flex gap-2">
        <input value={userId} onChange={(event) => setUserId(event.target.value)} placeholder="Add people by user ID…" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none"/>
        <select value={role} onChange={(event) => setRole(event.target.value)} className="rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none">
          {ROLES.map((r) => (<option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>))}
        </select>
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send Invite'}
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </form>);
}
