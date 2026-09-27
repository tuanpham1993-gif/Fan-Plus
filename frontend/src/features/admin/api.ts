import type {
  Category,
  Content,
  FanEvent,
  FAQ,
} from "../../domain/types";
import { apiClient } from "../../shared/http/client";
import type {
  AdminCategoryEnvelope,
  AdminContentEnvelope,
  AdminEventEnvelope,
  AdminFeedbackEnvelope,
  AdminKnowledgeEnvelope,
  AdminSubmissionDecision,
  AdminUserEnvelope,
  AdminWorkspace,
  AdminWorkspaceEnvelope,
} from "./types";

// Chunk 8 frontend contract. The current Flask source does not yet expose
// these /admin/* workspace routes; connected mode therefore reports the API
// error instead of silently reading the browser demo database.
export const ADMIN_ENDPOINTS = {
  workspace: "/admin/workspace",
  contents: "/admin/contents",
  content: (id: string) => `/admin/contents/${encodeURIComponent(id)}`,
  categories: "/admin/categories",
  category: (id: string) => `/admin/categories/${encodeURIComponent(id)}`,
  events: "/admin/events",
  event: (id: string) => `/admin/events/${encodeURIComponent(id)}`,
  submissions: (id: string) =>
    `/admin/submissions/${encodeURIComponent(id)}/moderate`,
  userStatus: (id: string) => `/admin/users/${encodeURIComponent(id)}/status`,
  feedbackStatus: (id: string) =>
    `/admin/feedback/${encodeURIComponent(id)}/status`,
  knowledge: "/admin/knowledge",
  knowledgeEntry: (id: string) =>
    `/admin/knowledge/${encodeURIComponent(id)}`,
} as const;

export const adminApi = {
  workspace: async (signal?: AbortSignal): Promise<AdminWorkspace> => {
    const result = await apiClient.get<AdminWorkspaceEnvelope>(
      ADMIN_ENDPOINTS.workspace,
      { signal },
    );
    return result.workspace;
  },

  createContent: (content: Content) =>
    apiClient.post<AdminContentEnvelope>(ADMIN_ENDPOINTS.contents, { content }),

  updateContent: (content: Content) =>
    apiClient.put<AdminContentEnvelope>(ADMIN_ENDPOINTS.content(content.id), {
      content,
    }),

  deleteContent: (id: string) =>
    apiClient.delete<{ ok: boolean }>(ADMIN_ENDPOINTS.content(id)),

  createCategory: (category: Category) =>
    apiClient.post<AdminCategoryEnvelope>(ADMIN_ENDPOINTS.categories, {
      category,
    }),

  updateCategory: (category: Category) =>
    apiClient.put<AdminCategoryEnvelope>(ADMIN_ENDPOINTS.category(category.id), {
      category,
    }),

  deleteCategory: (id: string) =>
    apiClient.delete<{ ok: boolean }>(ADMIN_ENDPOINTS.category(id)),

  createEvent: (event: FanEvent) =>
    apiClient.post<AdminEventEnvelope>(ADMIN_ENDPOINTS.events, { event }),

  updateEvent: (event: FanEvent) =>
    apiClient.put<AdminEventEnvelope>(ADMIN_ENDPOINTS.event(event.id), {
      event,
    }),

  deleteEvent: (id: string) =>
    apiClient.delete<{ ok: boolean }>(ADMIN_ENDPOINTS.event(id)),

  moderateSubmission: (
    id: string,
    decision: "approved" | "rejected",
    reason: string,
  ) =>
    apiClient.post<AdminSubmissionDecision>(ADMIN_ENDPOINTS.submissions(id), {
      decision,
      reason,
    }),

  setUserStatus: (id: string, suspended: boolean) =>
    apiClient.put<AdminUserEnvelope>(ADMIN_ENDPOINTS.userStatus(id), {
      suspended,
    }),

  resolveFeedback: (id: string) =>
    apiClient.put<AdminFeedbackEnvelope>(ADMIN_ENDPOINTS.feedbackStatus(id), {
      status: "resolved",
    }),

  createKnowledge: (faq: FAQ) =>
    apiClient.post<AdminKnowledgeEnvelope>(ADMIN_ENDPOINTS.knowledge, { faq }),

  updateKnowledge: (faq: FAQ) =>
    apiClient.put<AdminKnowledgeEnvelope>(
      ADMIN_ENDPOINTS.knowledgeEntry(faq.id),
      { faq },
    ),

  deleteKnowledge: (id: string) =>
    apiClient.delete<{ ok: boolean }>(ADMIN_ENDPOINTS.knowledgeEntry(id)),
};
