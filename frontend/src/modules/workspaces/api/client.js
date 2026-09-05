export class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}
async function request(path, options = {}) {
    const token = localStorage.getItem('token');
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    const apiBase = import.meta.env?.VITE_API_URL || '';

    let response;
    try {
        response = await fetch(`${apiBase}/api${path}`, {
            ...options,
            credentials: 'omit', // No cookies needed since we use Bearer token
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders,
                ...options.headers,
            },
        });
    } catch (networkErr) {
        // Backend is offline / unreachable — throw a friendly ApiError instead of crashing
        throw new ApiError('Backend is currently unavailable. Please ensure the server is running.', 0);
    }
    if (response.status === 204) {
        return undefined;
    }
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            window.location.href = '/login';
        }
        throw new ApiError(body.error ?? 'Something went wrong', response.status);
    }
    return body;
}
export const api = {
    get: (path) => request(path),
    post: (path, data) => request(path, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
    patch: (path, data) => request(path, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined }),
    delete: (path) => request(path, { method: 'DELETE' }),
};
