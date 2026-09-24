export class ApiError extends Error {
    status;
    code;
    fields;
    requestId;
    constructor(message, status, code, fields = {}, requestId) {
        super(message);
        this.status = status;
        this.code = code;
        this.fields = fields;
        this.requestId = requestId;
        this.name = 'ApiError';
    }
}
let csrfToken = null;
let csrfPending = null;
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function invalidateCsrf() { csrfToken = null; csrfPending = null; }
async function csrf() {
    if (csrfToken)
        return csrfToken;
    if (!csrfPending) {
        csrfPending = (async () => {
            const response = await fetch('/api/v1/auth/csrf', {
                credentials: 'same-origin', headers: { Accept: 'application/json' },
                signal: AbortSignal.timeout(15000),
            });
            const value = await response.json();
            if (!response.ok || !isRecord(value) || !isRecord(value.data)
                || typeof value.data.csrf_token !== 'string') {
                throw new ApiError('Could not initialize the secure session.', response.status, 'CSRF_INIT_FAILED');
            }
            csrfToken = value.data.csrf_token;
            return csrfToken;
        })().finally(() => { csrfPending = null; });
    }
    return csrfPending;
}
/** Returns an envelope, not the old frontend Page<T>. Validate data at the adapter boundary. */
export async function request(path, options = {}, signal) {
    if (!path.startsWith('/') || path.startsWith('//'))
        throw new Error('Use a relative API path.');
    const controller = new AbortController();
    const signals = [signal, options.signal].filter((s) => !!s);
    const abort = () => controller.abort();
    signals.forEach(s => { s.addEventListener('abort', abort, { once: true }); if (s.aborted)
        abort(); });
    const timer = setTimeout(abort, 15000);
    try {
        const method = (options.method ?? 'GET').toUpperCase();
        const headers = new Headers(options.headers);
        headers.set('Accept', 'application/json');
        if (options.body && !(options.body instanceof FormData))
            headers.set('Content-Type', 'application/json');
        if (!['GET', 'HEAD', 'OPTIONS'].includes(method))
            headers.set('X-CSRFToken', await csrf());
        if (controller.signal.aborted)
            throw new DOMException('Request cancelled.', 'AbortError');
        const response = await fetch('/api/v1' + path, {
            ...options, method, headers, credentials: 'same-origin', signal: controller.signal,
        });
        if (response.status === 204) {
            return { data: undefined, request_id: response.headers.get('X-Request-ID') ?? '' };
        }
        const value = await response.json().catch(() => null);
        if (!response.ok) {
            const error = isRecord(value) && isRecord(value.error) ? value.error : {};
            const code = typeof error.code === 'string' ? error.code : 'HTTP_ERROR';
            if (code === 'CSRF_INVALID')
                invalidateCsrf();
            // Do not automatically replay a POST/PUT after timeout or CSRF failure.
            throw new ApiError(typeof error.message === 'string' ? error.message : 'The server could not complete the request.', response.status, code, isRecord(error.fields) ? Object.fromEntries(Object.entries(error.fields).filter((e) => typeof e[1] === 'string')) : {}, isRecord(value) && typeof value.request_id === 'string' ? value.request_id : undefined);
        }
        if (!isRecord(value) || !('data' in value) || typeof value.request_id !== 'string') {
            throw new ApiError('The response does not match the API contract.', response.status, 'INVALID_RESPONSE');
        }
        return value; // Resource-specific validation belongs to the adapter.
    }
    finally {
        clearTimeout(timer);
        signals.forEach(s => s.removeEventListener('abort', abort));
    }
}
export const http = {
    resources: (query = {}, signal) => {
        const search = new URLSearchParams();
        for (const [key, value] of Object.entries(query))
            if (value !== undefined)
                search.set(key, String(value));
        return request('/resources?' + search.toString(), {}, signal);
    },
    resource: (id, signal) => request('/resources/' + encodeURIComponent(id), {}, signal),
    categories: (signal) => request('/categories', {}, signal),
    me: (signal) => request('/auth/me', {}, signal),
    login: async (email, password) => {
        const result = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
        invalidateCsrf();
        return result;
    },
    logout: async () => {
        await request('/auth/logout', { method: 'POST' });
        invalidateCsrf();
    },
    saveBookmark: (resourceId, note = '') => request('/me/bookmarks/' + encodeURIComponent(resourceId), { method: 'PUT', body: JSON.stringify({ note }) }),
    removeBookmark: (resourceId) => request('/me/bookmarks/' + encodeURIComponent(resourceId), { method: 'DELETE' }),
};
