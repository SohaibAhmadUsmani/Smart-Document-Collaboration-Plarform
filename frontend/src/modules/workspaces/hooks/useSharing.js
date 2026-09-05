import { useCallback, useEffect, useState } from 'react';
import { workspaceApi } from '../api/workspaceApi';
import { ApiError } from '../api/client';

/**
 * Custom React hook to fetch, manage, and refresh workspace sharing settings.
 * Handles loading state, error capture, and provides manual refresh capability.
 *
 * Yeh custom React hook workspace ke sharing settings fetch karne, manage karne, aur refresh karne ke liye hai.
 * Yeh loading state, error handling sambhalta hai, aur zaroorat parne par manual refresh karne ki sahulat deta hai.
 *
 * @param {string|null|undefined} workspaceId - The unique identifier of the target workspace. / Target workspace ki unique ID.
 * @returns {{
 *   sharing: Object|null,
 *   setSharing: React.Dispatch<React.SetStateAction<Object|null>>,
 *   loading: boolean,
 *   error: string|null,
 *   refresh: () => Promise<void>
 * }} Sharing state, setter, loading indicator, error message, and refresh function. / Sharing state, update function, loading indicator, error message, aur refresh function.
 */
export function useSharing(workspaceId) {
    const [sharing, setSharing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /**
     * Refreshes the sharing configuration for the specified workspace from the backend API.
     *
     * Backend API se specified workspace ke sharing settings ko dubara load (refresh) karta hai.
     */
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
