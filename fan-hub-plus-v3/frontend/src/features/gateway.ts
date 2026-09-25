import { demo } from "./demo";
import { api, json, serverMode } from "./http";
import type {
  Author,
  SocialData,
  PostInput,
  Campaign,
  ChatResult,
  Message,
  PublicProfile,
} from "./types";
export const gateway = {
  social: (u: Author | null) =>
    serverMode ? api<SocialData>("/community") : demo.social(u),
  publicProfile: (id: string) =>
    serverMode
      ? api<PublicProfile>("/users/" + encodeURIComponent(id))
      : demo.publicProfile(id),
  post: (u: Author | null, p: PostInput, id?: string, v?: number) =>
    serverMode
      ? api(
          "/community/posts" + (id ? "/" + id : ""),
          json(id ? "PATCH" : "POST", { ...p, ...(id ? { version: v } : {}) }),
        )
      : demo.post(u, p, id, v),
  removePost: (u: Author | null, id: string) =>
    serverMode
      ? api("/community/posts/" + id, { method: "DELETE" })
      : demo.removePost(u, id),
  moderate: (
    u: Author | null,
    id: string,
    d: string,
    v: number,
    reason: string,
  ) =>
    serverMode
      ? api(
          "/community/posts/" + id + "/moderate",
          json("POST", { decision: d, version: v, reason }),
        )
      : demo.moderate(u, id, d, v, reason),
  react: (u: Author | null, id: string, kind: "like" | "heart" | null) =>
    serverMode
      ? api("/community/posts/" + id + "/reaction", json("PUT", { kind }))
      : demo.react(u, id, kind),
  comment: (
    u: Author | null,
    id: string,
    body: string,
    parentId: string | null,
  ) =>
    serverMode
      ? api(
          "/community/posts/" + id + "/comments",
          json("POST", { body, parentId }),
        )
      : demo.comment(u, id, body, parentId),
  removeComment: (u: Author | null, id: string) =>
    serverMode
      ? api("/community/comments/" + id, { method: "DELETE" })
      : demo.removeComment(u, id),
  report: (
    u: Author | null,
    id: string,
    reason: string,
    commentId: string | null = null,
  ) =>
    serverMode
      ? api(
          "/community/posts/" + id + "/reports",
          json("POST", { reason, commentId }),
        )
      : demo.report(u, id, reason, commentId),
  resolveReport: (u: Author | null, id: string, hide: boolean) =>
    serverMode
      ? api("/community/reports/" + id, json("PATCH", { hide }))
      : demo.resolveReport(u, id, hide),
  campaigns: () =>
    serverMode
      ? api<{ id: string; title: string; status: string }[]>("/giveaways")
      : demo.campaigns(),
  campaign: (u: Author | null, id?: string) =>
    serverMode
      ? api<Campaign>("/giveaways/" + (id || "current"))
      : demo.campaign(u, id),
  enter: (u: Author | null, id: string, agree: boolean) =>
    serverMode
      ? api("/giveaways/" + id + "/entries", json("POST", { agree }))
      : demo.enter(u, id, agree),
  freeze: (u: Author | null, id: string) =>
    serverMode
      ? api("/giveaways/" + id + "/freeze", json("POST", {}))
      : demo.freeze(u, id),
  draw: (u: Author | null, id: string) =>
    serverMode
      ? api("/giveaways/" + id + "/draw", json("POST", {}))
      : demo.draw(u, id),
  chat: (
    u: Author | null,
    q: string,
    safe: boolean,
    topic: string,
    signal?: AbortSignal,
  ) =>
    serverMode
      ? api<ChatResult>("/lore/messages", {
          ...json("POST", { question: q, spoilerSafe: safe, topic }),
          signal,
        })
      : demo.chat(u, q, safe, topic),
  history: (u: Author | null) =>
    serverMode ? api<Message[]>("/lore/history") : demo.history(u),
  saveChat: (u: Author | null, m: Message[]) =>
    serverMode ? Promise.resolve() : demo.saveChat(u, m),
  clearChat: (u: Author | null) =>
    serverMode ? api("/lore/history", { method: "DELETE" }) : demo.clearChat(u),
};
