import { useCallback, useEffect, useState } from 'react';
import { workspaceApi } from '../api/workspaceApi';
import { ApiError } from '../api/client';
export function useMembers(workspaceId) {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const refresh = useCallback(async () => {
        if (!workspaceId)
            return;
        setLoading(true);
        setError(null);
        try {
            const { members: data } = await workspaceApi.listMembers(workspaceId);
            setMembers(data);
        }
        catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to load members');
        }
        finally {
            setLoading(false);
        }
    }, [workspaceId]);
    useEffect(() => {
        refresh();
    }, [refresh]);
    return { members, loading, error, refresh };
}
