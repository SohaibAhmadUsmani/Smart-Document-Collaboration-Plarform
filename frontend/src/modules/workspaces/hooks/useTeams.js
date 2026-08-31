import { useCallback, useEffect, useState } from 'react';
import { workspaceApi } from '../api/workspaceApi';
import { ApiError } from '../api/client';
export function useTeams(workspaceId) {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const refresh = useCallback(async () => {
        if (!workspaceId)
            return;
        setLoading(true);
        setError(null);
        try {
            const { teams: data } = await workspaceApi.listTeams(workspaceId);
            setTeams(data);
        }
        catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to load teams');
        }
        finally {
            setLoading(false);
        }
    }, [workspaceId]);
    useEffect(() => {
        refresh();
    }, [refresh]);
    return { teams, loading, error, refresh };
}
