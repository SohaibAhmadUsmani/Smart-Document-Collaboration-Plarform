import { useCallback, useEffect, useState } from 'react';
import { workspaceApi } from '../api/workspaceApi';
import { ApiError } from '../api/client';
/** Builds a tree from the flat folder list the backend returns. */
export function buildFolderTree(folders) {
    const byId = new Map(folders.map((folder) => [folder._id, { ...folder, children: [] }]));
    const roots = [];
    for (const folder of byId.values()) {
        if (folder.parentFolder && byId.has(folder.parentFolder)) {
            byId.get(folder.parentFolder).children.push(folder);
        }
        else {
            roots.push(folder);
        }
    }
    return roots;
}
export function useFolders(workspaceId) {
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const refresh = useCallback(async () => {
        if (!workspaceId)
            return;
        setLoading(true);
        setError(null);
        try {
            const { folders: data } = await workspaceApi.listFolders(workspaceId);
            setFolders(data);
        }
        catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to load folders');
        }
        finally {
            setLoading(false);
        }
    }, [workspaceId]);
    useEffect(() => {
        refresh();
    }, [refresh]);
    return { folders, tree: buildFolderTree(folders), loading, error, refresh };
}
