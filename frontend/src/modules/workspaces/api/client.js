export class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}
async function request(path, options = {}) {
    const response = await fetch(`/api${path}`, {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
    if (response.status === 204) {
        return undefined;
    }
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
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
