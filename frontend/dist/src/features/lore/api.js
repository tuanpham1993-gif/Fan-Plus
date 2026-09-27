import { apiClient } from "../../shared/http/client.js";
export const LORE_ENDPOINTS = {
    status: "/lore/status",
    messages: "/lore/messages",
    history: "/lore/history",
    source: (sourceId) => `/lore/sources/${encodeURIComponent(sourceId)}`,
};
export const loreApi = {
    status: (signal) => apiClient.get(LORE_ENDPOINTS.status, { signal }),
    history: (signal) => apiClient.get(LORE_ENDPOINTS.history, { signal }),
    send: (input, signal) => apiClient.post(LORE_ENDPOINTS.messages, input, { signal }),
    clear: (signal) => apiClient.delete(LORE_ENDPOINTS.history, { signal }),
    source: (sourceId, signal) => apiClient.get(LORE_ENDPOINTS.source(sourceId), { signal }),
};
