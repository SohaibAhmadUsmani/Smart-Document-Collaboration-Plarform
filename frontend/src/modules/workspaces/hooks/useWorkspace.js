import { useCallback, useEffect, useState } from 'react';
import { workspaceApi } from '../api/workspaceApi';
import { ApiError } from '../api/client';
export function useWorkspace(workspaceId) {
    const [workspace, setWorkspace] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const refresh = useCallback(async () => {
        if (!workspaceId)
            return;
        setLoading(true);
        setError(null);
        try {
            const data = await workspaceApi.get(workspaceId);
            setWorkspace(data.workspace);
            setRole(data.role);
        }
        catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to load workspace');
        }
        finally {
            setLoading(false);
        }
    }, [workspaceId]);
    useEffect(() => {
        refresh();
    }, [refresh]);
    return { workspace, role, loading, error, refresh };
}
