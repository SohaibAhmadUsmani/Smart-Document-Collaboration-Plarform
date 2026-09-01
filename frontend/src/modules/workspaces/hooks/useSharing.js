import { useCallback, useEffect, useState } from 'react';
import { workspaceApi } from '../api/workspaceApi';
import { ApiError } from '../api/client';
export function useSharing(workspaceId) {
    const [sharing, setSharing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const refresh = useCallback(async () => {
        if (!workspaceId)
            return;
        setLoading(true);
        setError(null);
        try {
            const data = await workspaceApi.getSharing(workspaceId);
            setSharing(data.sharing);
        }
        catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to load sharing settings');
        }
        finally {
            setLoading(false);
        }
    }, [workspaceId]);
    useEffect(() => {
        refresh();
    }, [refresh]);
    return { sharing, setSharing, loading, error, refresh };
}
