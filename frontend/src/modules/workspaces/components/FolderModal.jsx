import { useEffect, useState } from 'react';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { workspaceApi } from '../api/workspaceApi';
import { ApiError } from '../api/client';
export function FolderModal({ open, onClose, onSaved, workspaceId, parentFolderId, folder }) {
    const isRename = Boolean(folder);
    const [name, setName] = useState(folder?.name ?? '');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        setName(folder?.name ?? '');
        setError(null);
    }, [folder, open]);
    async function handleSubmit(event) {
        event.preventDefault();
        if (!name.trim()) {
            setError('Folder name is required');
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            if (isRename && folder) {
                await workspaceApi.renameFolder(folder._id, name.trim());
            }
            else {
                await workspaceApi.createFolder(workspaceId, { name: name.trim(), parentFolderId });
            }
            onSaved();
            onClose();
        }
        catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to save folder');
        }
        finally {
            setSubmitting(false);
        }
    }
    return (<Modal open={open} onClose={onClose} title={isRename ? 'Rename folder' : 'New folder'} footer={<>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving…' : isRename ? 'Save' : 'Create folder'}
          </Button>
        </>}>
      <form onSubmit={handleSubmit}>
        <label htmlFor="folder-name" className="mb-1 block text-sm font-medium text-ink-700">
          Folder name
        </label>
        <input id="folder-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Reports" maxLength={150} autoFocus className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none"/>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </form>
    </Modal>);
}
