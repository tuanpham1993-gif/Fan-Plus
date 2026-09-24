/** Flask contract client. The delivered screens still use repository.ts (local demo).
 * Connect each screen through validated DTO adapters; never mix local and remote writes.
 * Authentication cookies are sent by the browser. No token is stored in localStorage.
 */
export interface UserDto {
    id: string;
    email: string;
    display_name: string;
    role: 'member' | 'admin';
    bio: string;
    email_verified: boolean;
}
export interface ResourceDto {
    id: string;
    slug: string;
    title: string;
    summary: string;
    kind: 'article' | 'character' | 'video' | 'audio' | 'gallery' | 'merchandise' | 'event';
    category_id: string;
    category_name: string;
    category_slug: string;
    fandom_id: string | null;
    fandom_name: string | null;
    cover_url: string | null;
    release_year: number | null;
    has_spoilers: boolean;
    published_at: string | null;
    rating_average: number;
    rating_count: number;
    bookmark_count: number;
    version: number;
    body_markdown?: string;
}
export interface Envelope<T> {
    data: T;
    request_id: string;
    meta?: { page: number; page_size: number; total: number; total_pages: number };
}
export class ApiError extends Error {
    constructor(
        message: string,
        public readonly status: number,
        public readonly code: string,
        public readonly fields: Record<string, string> = {},
        public readonly requestId?: string,
    ) { super(message); this.name = 'ApiError'; }
}
let csrfToken: string | null = null;
let csrfPending: Promise<string> | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function invalidateCsrf(): void { csrfToken = null; csrfPending = null; }

async function csrf(): Promise<string> {
    if (csrfToken) return csrfToken;
    if (!csrfPending) {
        csrfPending = (async () => {
            const response = await fetch('/api/v1/auth/csrf', {
                credentials: 'same-origin', headers: { Accept: 'application/json' },
                signal: AbortSignal.timeout(15000),
            });
            const value: unknown = await response.json();
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
export async function request<T>(path: string, options: RequestInit = {}, signal?: AbortSignal): Promise<Envelope<T>> {
    if (!path.startsWith('/') || path.startsWith('//')) throw new Error('Use a relative API path.');
    const controller = new AbortController();
    const signals = [signal, options.signal].filter((s): s is AbortSignal => !!s);
    const abort = () => controller.abort();
    signals.forEach(s => { s.addEventListener('abort', abort, { once: true }); if (s.aborted) abort(); });
    const timer = setTimeout(abort, 15000);
    try {
        const method = (options.method ?? 'GET').toUpperCase();
        const headers = new Headers(options.headers);
        headers.set('Accept', 'application/json');
        if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
        if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) headers.set('X-CSRFToken', await csrf());
        if (controller.signal.aborted) throw new DOMException('Request cancelled.', 'AbortError');
        const response = await fetch('/api/v1' + path, {
            ...options, method, headers, credentials: 'same-origin', signal: controller.signal,
        });
        if (response.status === 204) {
            return { data: undefined as T, request_id: response.headers.get('X-Request-ID') ?? '' };
        }
        const value: unknown = await response.json().catch(() => null);
        if (!response.ok) {
            const error = isRecord(value) && isRecord(value.error) ? value.error : {};
            const code = typeof error.code === 'string' ? error.code : 'HTTP_ERROR';
            if (code === 'CSRF_INVALID') invalidateCsrf();
            // Do not automatically replay a POST/PUT after timeout or CSRF failure.
            throw new ApiError(
                typeof error.message === 'string' ? error.message : 'The server could not complete the request.',
                response.status, code,
                isRecord(error.fields) ? Object.fromEntries(Object.entries(error.fields).filter((e): e is [string, string] => typeof e[1] === 'string')) : {},
                isRecord(value) && typeof value.request_id === 'string' ? value.request_id : undefined,
            );
        }
        if (!isRecord(value) || !('data' in value) || typeof value.request_id !== 'string') {
            throw new ApiError('The response does not match the API contract.', response.status, 'INVALID_RESPONSE');
        }
        return value as unknown as Envelope<T>; // Resource-specific validation belongs to the adapter.
    } finally {
        clearTimeout(timer);
        signals.forEach(s => s.removeEventListener('abort', abort));
    }
}

export const http = {
    resources: (query: Record<string, string | number | undefined> = {}, signal?: AbortSignal) => {
        const search = new URLSearchParams();
        for (const [key, value] of Object.entries(query)) if (value !== undefined) search.set(key, String(value));
        return request<ResourceDto[]>('/resources?' + search.toString(), {}, signal);
    },
    resource: (id: string, signal?: AbortSignal) => request<ResourceDto>('/resources/' + encodeURIComponent(id), {}, signal),
    categories: (signal?: AbortSignal) => request<{ id: string; slug: string; name: string; description: string }[]>('/categories', {}, signal),
    me: (signal?: AbortSignal) => request<UserDto>('/auth/me', {}, signal),
    login: async (email: string, password: string) => {
        const result = await request<UserDto>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
        invalidateCsrf();
        return result;
    },
    logout: async () => {
        await request<void>('/auth/logout', { method: 'POST' });
        invalidateCsrf();
    },
    saveBookmark: (resourceId: string, note = '') => request('/me/bookmarks/' + encodeURIComponent(resourceId), { method: 'PUT', body: JSON.stringify({ note }) }),
    removeBookmark: (resourceId: string) => request<void>('/me/bookmarks/' + encodeURIComponent(resourceId), { method: 'DELETE' }),
};
