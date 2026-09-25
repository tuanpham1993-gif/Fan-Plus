import { demo } from "./demo.js";
import { api, json, serverMode } from "./http.js";
export const gateway = {
    social: (u) => serverMode ? api("/community") : demo.social(u),
    publicProfile: (id) => serverMode
        ? api("/users/" + encodeURIComponent(id))
        : demo.publicProfile(id),
    post: (u, p, id, v) => serverMode
        ? api("/community/posts" + (id ? "/" + id : ""), json(id ? "PATCH" : "POST", { ...p, ...(id ? { version: v } : {}) }))
        : demo.post(u, p, id, v),
    removePost: (u, id) => serverMode
        ? api("/community/posts/" + id, { method: "DELETE" })
        : demo.removePost(u, id),
    moderate: (u, id, d, v, reason) => serverMode
        ? api("/community/posts/" + id + "/moderate", json("POST", { decision: d, version: v, reason }))
        : demo.moderate(u, id, d, v, reason),
    react: (u, id, kind) => serverMode
        ? api("/community/posts/" + id + "/reaction", json("PUT", { kind }))
        : demo.react(u, id, kind),
    comment: (u, id, body, parentId) => serverMode
        ? api("/community/posts/" + id + "/comments", json("POST", { body, parentId }))
        : demo.comment(u, id, body, parentId),
    removeComment: (u, id) => serverMode
        ? api("/community/comments/" + id, { method: "DELETE" })
        : demo.removeComment(u, id),
    report: (u, id, reason, commentId = null) => serverMode
        ? api("/community/posts/" + id + "/reports", json("POST", { reason, commentId }))
        : demo.report(u, id, reason, commentId),
    resolveReport: (u, id, hide) => serverMode
        ? api("/community/reports/" + id, json("PATCH", { hide }))
        : demo.resolveReport(u, id, hide),
    campaigns: () => serverMode
        ? api("/giveaways")
        : demo.campaigns(),
    campaign: (u, id) => serverMode
        ? api("/giveaways/" + (id || "current"))
        : demo.campaign(u, id),
    enter: (u, id, agree) => serverMode
        ? api("/giveaways/" + id + "/entries", json("POST", { agree }))
        : demo.enter(u, id, agree),
    freeze: (u, id) => serverMode
        ? api("/giveaways/" + id + "/freeze", json("POST", {}))
        : demo.freeze(u, id),
    draw: (u, id) => serverMode
        ? api("/giveaways/" + id + "/draw", json("POST", {}))
        : demo.draw(u, id),
    chat: (u, q, safe, topic, signal) => serverMode
        ? api("/lore/messages", {
            ...json("POST", { question: q, spoilerSafe: safe, topic }),
            signal,
        })
        : demo.chat(u, q, safe, topic),
    history: (u) => serverMode ? api("/lore/history") : demo.history(u),
    saveChat: (u, m) => serverMode ? Promise.resolve() : demo.saveChat(u, m),
    clearChat: (u) => serverMode ? api("/lore/history", { method: "DELETE" }) : demo.clearChat(u),
};
