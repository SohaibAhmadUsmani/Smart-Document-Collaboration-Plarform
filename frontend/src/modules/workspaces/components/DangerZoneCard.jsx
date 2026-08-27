import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/Button';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { useToast } from '../../../components/Toast';
import { workspaceApi } from '../api/workspaceApi';
import { ApiError } from '../api/client';
export function DangerZoneCard({ workspaceId, workspaceName }) {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    async function handleDelete() {
        setDeleting(true);
        try {
            await workspaceApi.remove(workspaceId);
            showToast(`"${workspaceName}" deleted`);
            navigate('/workspaces');
        }
        catch (err) {
            showToast(err instanceof ApiError ? err.message : 'Failed to delete workspace', 'error');
            setDeleting(false);
            setConfirmOpen(false);
        }
    }
    return (<div className="rounded-xl border border-red-200 bg-red-50/40 p-5">
      <h3 className="text-sm font-semibold text-red-700">Danger Zone</h3>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-sm text-ink-700">
          Delete this workspace and everything in it — folders, teams, and member access.
        </p>
        <Button variant="danger-filled" onClick={() => setConfirmOpen(true)}>
          Delete workspace
        </Button>
      </div>

      <ConfirmDialog open={confirmOpen} title="Delete workspace?" description={`"${workspaceName}" and all of its folders and teams will be permanently deleted. This can't be undone.`} confirmLabel="Delete workspace" busy={deleting} onConfirm={handleDelete} onCancel={() => setConfirmOpen(false)}/>
    </div>);
}
