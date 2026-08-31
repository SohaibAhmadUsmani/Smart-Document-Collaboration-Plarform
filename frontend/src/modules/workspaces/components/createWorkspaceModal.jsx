import { useState } from 'react';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { workspaceApi } from '../api/workspaceApi';
import { ApiError } from '../api/client';
export function CreateWorkspaceModal({ open, onClose, onCreated }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    function reset() {
        setName('');
        setDescription('');
        setError(null);
    }
    async function handleSubmit(event) {
        event.preventDefault();
        if (!name.trim()) {
            setError('Workspace name is required');
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            const { workspace } = await workspaceApi.create({ name, description });
            onCreated(workspace);
            reset();
            onClose();
        }
        catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to create workspace');
        }
        finally {
            setSubmitting(false);
        }
    }
    return (<Modal open={open} onClose={() => {
            reset();
            onClose();
        }} title="Create workspace" description="A workspace holds folders, teams, and shared documents for a group of people." footer={<>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Creating…' : 'Create workspace'}
          </Button>
        </>}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="workspace-name" className="mb-1 block text-sm font-medium text-ink-700">
            Name
          </label>
          <input id="workspace-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Marketing Team" maxLength={120} autoFocus className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none"/>
        </div>
        <div>
          <label htmlFor="workspace-description" className="mb-1 block text-sm font-medium text-ink-700">
            Description <span className="font-normal text-ink-400">(optional)</span>
          </label>
          <textarea id="workspace-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What's this workspace for?" maxLength={500} rows={3} className="w-full resize-none rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none"/>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </Modal>);
}
