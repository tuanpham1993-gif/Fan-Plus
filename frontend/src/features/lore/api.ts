import { apiClient } from "../../shared/http/client";
import type { ChatResult, Knowledge, Message } from "../types";

export interface LoreServiceStatus {
  mode: "openai" | "extractive-server" | string;
  providerCallVerified: boolean;
}

export interface LoreMessageRequest {
  question: string;
  spoilerSafe: boolean;
  topic: string;
}

export const LORE_ENDPOINTS = {
  status: "/lore/status",
  messages: "/lore/messages",
  history: "/lore/history",
  source: (sourceId: string) =>
    `/lore/sources/${encodeURIComponent(sourceId)}`,
} as const;

export const loreApi = {
  status: (signal?: AbortSignal) =>
    apiClient.get<LoreServiceStatus>(LORE_ENDPOINTS.status, { signal }),

  history: (signal?: AbortSignal) =>
    apiClient.get<Message[]>(LORE_ENDPOINTS.history, { signal }),

  send: (input: LoreMessageRequest, signal?: AbortSignal) =>
    apiClient.post<ChatResult>(LORE_ENDPOINTS.messages, input, { signal }),

  clear: (signal?: AbortSignal) =>
    apiClient.delete<{ ok: boolean }>(LORE_ENDPOINTS.history, { signal }),

  source: (sourceId: string, signal?: AbortSignal) =>
    apiClient.get<Knowledge>(LORE_ENDPOINTS.source(sourceId), { signal }),
};
