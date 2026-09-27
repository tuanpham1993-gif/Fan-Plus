import { serverMode } from "../../shared/http/client.js";
import { demo } from "../demo.js";
import { knowledge } from "../seed.js";
import { loreApi, } from "./api.js";
const apiLoreDataSource = {
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
const demoLoreDataSource = {
    async status() {
        return {
            mode: "extractive-demo",
            providerCallVerified: false,
        };
    },
    history: (user) => demo.history(user),
    send: (user, input) => demo.chat(user, input.question, input.spoilerSafe, input.topic),
    persistDemoHistory: (user, messages) => demo.saveChat(user, messages),
    clear: (user) => demo.clearChat(user),
    async source(sourceId) {
        const doc = knowledge.find((item) => item.id === sourceId);
        if (!doc || doc.status !== "published") {
            const error = new Error("Source not found.");
            error.status = 404;
            throw error;
        }
        return doc;
    },
};
export const loreDataSource = serverMode
    ? apiLoreDataSource
    : demoLoreDataSource;
