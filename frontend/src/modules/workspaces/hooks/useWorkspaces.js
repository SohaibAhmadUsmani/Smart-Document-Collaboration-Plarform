import { useCallback, useEffect, useState } from 'react';
import { workspaceApi } from '../api/workspaceApi';
import { ApiError } from '../api/client';
export function useWorkspaces() {
    const [workspaces, setWorkspaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { workspaces: data } = await workspaceApi.list();
            setWorkspaces(data);
        }
        catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to load workspaces');
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        refresh();
    }, [refresh]);
    return { workspaces, loading, error, refresh };
}
