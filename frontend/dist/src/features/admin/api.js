import { apiClient } from "../../shared/http/client.js";
// Chunk 8 frontend contract. The current Flask source does not yet expose
// these /admin/* workspace routes; connected mode therefore reports the API
// error instead of silently reading the browser demo database.
export const ADMIN_ENDPOINTS = {
    workspace: "/admin/workspace",
    contents: "/admin/contents",
    content: (id) => `/admin/contents/${encodeURIComponent(id)}`,
    categories: "/admin/categories",
    category: (id) => `/admin/categories/${encodeURIComponent(id)}`,
    events: "/admin/events",
    event: (id) => `/admin/events/${encodeURIComponent(id)}`,
    submissions: (id) => `/admin/submissions/${encodeURIComponent(id)}/moderate`,
    userStatus: (id) => `/admin/users/${encodeURIComponent(id)}/status`,
    feedbackStatus: (id) => `/admin/feedback/${encodeURIComponent(id)}/status`,
    knowledge: "/admin/knowledge",
    knowledgeEntry: (id) => `/admin/knowledge/${encodeURIComponent(id)}`,
};
export const adminApi = {
    workspace: async (signal) => {
        const result = await apiClient.get(ADMIN_ENDPOINTS.workspace, { signal });
        return result.workspace;
    },
    createContent: (content) => apiClient.post(ADMIN_ENDPOINTS.contents, { content }),
    updateContent: (content) => apiClient.put(ADMIN_ENDPOINTS.content(content.id), {
        content,
    }),
    deleteContent: (id) => apiClient.delete(ADMIN_ENDPOINTS.content(id)),
    createCategory: (category) => apiClient.post(ADMIN_ENDPOINTS.categories, {
        category,
    }),
    updateCategory: (category) => apiClient.put(ADMIN_ENDPOINTS.category(category.id), {
        category,
    }),
    deleteCategory: (id) => apiClient.delete(ADMIN_ENDPOINTS.category(id)),
    createEvent: (event) => apiClient.post(ADMIN_ENDPOINTS.events, { event }),
    updateEvent: (event) => apiClient.put(ADMIN_ENDPOINTS.event(event.id), {
        event,
    }),
    deleteEvent: (id) => apiClient.delete(ADMIN_ENDPOINTS.event(id)),
    moderateSubmission: (id, decision, reason) => apiClient.post(ADMIN_ENDPOINTS.submissions(id), {
        decision,
        reason,
    }),
    setUserStatus: (id, suspended) => apiClient.put(ADMIN_ENDPOINTS.userStatus(id), {
        suspended,
    }),
    resolveFeedback: (id) => apiClient.put(ADMIN_ENDPOINTS.feedbackStatus(id), {
        status: "resolved",
    }),
    createKnowledge: (faq) => apiClient.post(ADMIN_ENDPOINTS.knowledge, { faq }),
    updateKnowledge: (faq) => apiClient.put(ADMIN_ENDPOINTS.knowledgeEntry(faq.id), { faq }),
    deleteKnowledge: (id) => apiClient.delete(ADMIN_ENDPOINTS.knowledgeEntry(id)),
};
