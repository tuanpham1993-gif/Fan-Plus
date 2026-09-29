import type {
  Category,
  Content,
  Database,
  FanEvent,
  FAQ,
} from "../../domain/types";
import { AppError, repository } from "../../services/repository";
import { serverMode } from "../../shared/http/client";
import { adminApi } from "./api";
import type { AdminWorkspace } from "./types";

export interface AdminDataSource {
  load(signal?: AbortSignal): Promise<AdminWorkspace>;
  saveContent(content: Content): Promise<AdminWorkspace>;
  deleteContent(id: string): Promise<AdminWorkspace>;
  saveCategory(category: Category): Promise<AdminWorkspace>;
  deleteCategory(id: string): Promise<AdminWorkspace>;
  saveEvent(event: FanEvent): Promise<AdminWorkspace>;
  deleteEvent(id: string): Promise<AdminWorkspace>;
  moderateSubmission(
    id: string,
    decision: "approved" | "rejected",
    reason: string,
  ): Promise<AdminWorkspace>;
  setUserStatus(id: string, suspended: boolean): Promise<AdminWorkspace>;
  resolveFeedback(id: string): Promise<AdminWorkspace>;
  saveKnowledge(faq: FAQ): Promise<AdminWorkspace>;
  deleteKnowledge(id: string): Promise<AdminWorkspace>;
}

function assertDemoAdmin(db: Database) {
  const user = repository.currentSessionUser();
  if (!user || user.role !== "admin" || user.status === "suspended")
    throw new AppError("This action requires an administrator.", 403);
}

export function workspaceFromDatabase(db: Database): AdminWorkspace {
  return {
    categories: db.categories,
    contents: db.contents,
    events: db.events,
    users: db.users,
    feedback: db.feedback,
    submissions: db.submissions,
    faqs: db.faqs,
  };
}

async function reloadConnected() {
  return adminApi.workspace();
}

const apiDataSource: AdminDataSource = {
  load: (signal) => adminApi.workspace(signal),

  async saveContent(content) {
    if (content.id) await adminApi.updateContent(content);
    else await adminApi.createContent(content);
    return reloadConnected();
  },

  async deleteContent(id) {
    await adminApi.deleteContent(id);
    return reloadConnected();
  },

  async saveCategory(category) {
    if (category.id) await adminApi.updateCategory(category);
    else await adminApi.createCategory(category);
    return reloadConnected();
  },

  async deleteCategory(id) {
    await adminApi.deleteCategory(id);
    return reloadConnected();
  },

  async saveEvent(event) {
    if (event.id) await adminApi.updateEvent(event);
    else await adminApi.createEvent(event);
    return reloadConnected();
  },

  async deleteEvent(id) {
    await adminApi.deleteEvent(id);
    return reloadConnected();
  },

  async moderateSubmission(id, decision, reason) {
    await adminApi.moderateSubmission(id, decision, reason);
    return reloadConnected();
  },

  async setUserStatus(id, suspended) {
    await adminApi.setUserStatus(id, suspended);
    return reloadConnected();
  },

  async resolveFeedback(id) {
    await adminApi.resolveFeedback(id);
    return reloadConnected();
  },

  async saveKnowledge(faq) {
    if (faq.id) await adminApi.updateKnowledge(faq);
    else await adminApi.createKnowledge(faq);
    return reloadConnected();
  },

  async deleteKnowledge(id) {
    await adminApi.deleteKnowledge(id);
    return reloadConnected();
  },
};

const demoDataSource: AdminDataSource = {
  async load() {
    const db = await repository.load();
    assertDemoAdmin(db);
    return workspaceFromDatabase(db);
  },

  async saveContent(content) {
    return workspaceFromDatabase(await repository.saveContent(content));
  },

  async deleteContent(id) {
    return workspaceFromDatabase(await repository.deleteContent(id));
  },

  async saveCategory(category) {
    return workspaceFromDatabase(await repository.saveCategory(category));
  },

  async deleteCategory(id) {
    return workspaceFromDatabase(await repository.deleteCategory(id));
  },

  async saveEvent(event) {
    return workspaceFromDatabase(await repository.saveEvent(event));
  },

  async deleteEvent(id) {
    return workspaceFromDatabase(await repository.deleteEvent(id));
  },

  async moderateSubmission(id, decision, reason) {
    return workspaceFromDatabase(
      await repository.moderate(id, decision, reason),
    );
  },

  async setUserStatus(id, suspended) {
    return workspaceFromDatabase(await repository.setUserStatus(id, suspended));
  },

  async resolveFeedback(id) {
    return workspaceFromDatabase(await repository.resolveFeedback(id));
  },

  async saveKnowledge(faq) {
    return workspaceFromDatabase(await repository.saveFaq(faq));
  },

  async deleteKnowledge(id) {
    return workspaceFromDatabase(await repository.deleteFaq(id));
  },
};

export const adminDataSource: AdminDataSource = serverMode
  ? apiDataSource
  : demoDataSource;
