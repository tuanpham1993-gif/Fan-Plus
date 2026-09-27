import type { User } from "../../domain/types";
import { serverMode } from "../../shared/http/client";
import { demo } from "../demo";
import { knowledge } from "../seed";
import type { ChatResult, Knowledge, Message } from "../types";
import {
  loreApi,
  type LoreMessageRequest,
  type LoreServiceStatus,
} from "./api";

export interface LoreDataSource {
  status(signal?: AbortSignal): Promise<LoreServiceStatus>;
  history(user: User | null, signal?: AbortSignal): Promise<Message[]>;
  send(
    user: User | null,
    input: LoreMessageRequest,
    signal?: AbortSignal,
  ): Promise<ChatResult>;
  persistDemoHistory(user: User | null, messages: Message[]): Promise<void>;
  clear(user: User | null, signal?: AbortSignal): Promise<void>;
  source(sourceId: string, signal?: AbortSignal): Promise<Knowledge>;
}

const apiLoreDataSource: LoreDataSource = {
  status: (signal) => loreApi.status(signal),
  history: (_user, signal) => loreApi.history(signal),
  send: (_user, input, signal) => loreApi.send(input, signal),
  persistDemoHistory: async () => {
    // Connected mode persists chat history on the Backend. The browser must not
    // become a second source of truth for server conversations.
  },
  clear: async (_user, signal) => {
    await loreApi.clear(signal);
  },
  source: (sourceId, signal) => loreApi.source(sourceId, signal),
};

const demoLoreDataSource: LoreDataSource = {
  async status() {
    return {
      mode: "extractive-demo",
      providerCallVerified: false,
    };
  },
  history: (user) => demo.history(user),
  send: (user, input) =>
    demo.chat(user, input.question, input.spoilerSafe, input.topic),
  persistDemoHistory: (user, messages) => demo.saveChat(user, messages),
  clear: (user) => demo.clearChat(user),
  async source(sourceId) {
    const doc = knowledge.find((item) => item.id === sourceId);
    if (!doc || doc.status !== "published") {
      const error = new Error("Source not found.") as Error & { status?: number };
      error.status = 404;
      throw error;
    }
    return doc;
  },
};

export const loreDataSource: LoreDataSource = serverMode
  ? apiLoreDataSource
  : demoLoreDataSource;
