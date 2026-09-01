import { useState } from 'react';
import { Button } from '../../../components/Button';
import { workspaceApi } from '../api/workspaceApi';
import { ApiError } from '../api/client';
export function TeamsPanel({ workspaceId, teams, loading, canManage, onChanged }) {
    const [adding, setAdding] = useState(false);
    const [name, setName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    async function handleCreate(event) {
        event.preventDefault();
        if (!name.trim())
            return;
        setSubmitting(true);
        setError(null);
        try {
            await workspaceApi.createTeam(workspaceId, name.trim());
            setName('');
            setAdding(false);
            onChanged();
        }
        catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to create team');
        }
        finally {
            setSubmitting(false);
        }
    }
    return (<div className="rounded-xl border border-border bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-400">Teams</h3>
        {canManage && !adding && (<button type="button" onClick={() => setAdding(true)} className="text-xs font-medium text-accent hover:underline">
            + Add
          </button>)}
      </div>

      <div className="mt-3 space-y-2">
        {loading ? ([...Array(2)].map((_, i) => <div key={i} className="h-6 animate-pulse rounded bg-canvas"/>)) : teams.length === 0 && !adding ? (<p className="text-sm text-ink-500">No teams yet.</p>) : (teams.map((team) => (<div key={team._id} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-canvas">
              <span className="text-sm text-ink-700">{team.name}</span>
              <span className="text-xs text-ink-400">{team.members.length} member{team.members.length === 1 ? '' : 's'}</span>
            </div>)))}
      </div>

      {adding && (<form onSubmit={handleCreate} className="mt-3 flex gap-2">
          <input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Team name" maxLength={120} className="w-full rounded-lg border border-border px-2.5 py-1.5 text-sm focus:border-accent focus:outline-none"/>
          <Button type="submit" variant="primary" size="sm" disabled={submitting}>
            Add
          </Button>
        </form>)}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>);
}
