import { apiClient } from "../../shared/http/client";
import type {
  Post,
  PostInput,
  SocialData,
} from "../types";

export type ReactionKind = "like" | "heart" | null;

export const communityApi = {
  feed: (signal?: AbortSignal) =>
    apiClient.get<SocialData>("/community", { signal }),

  createPost: (input: PostInput) =>
    apiClient.post<Post>("/community/posts", input),

  updatePost: (id: string, input: PostInput, version: number) =>
    apiClient.patch<Post>(`/community/posts/${encodeURIComponent(id)}`, {
      ...input,
      version,
    }),

  removePost: (id: string) =>
    apiClient.delete<{ ok: boolean }>(
      `/community/posts/${encodeURIComponent(id)}`,
    ),

  setReaction: (postId: string, kind: ReactionKind) =>
    apiClient.put<{ ok: boolean }>(
      `/community/posts/${encodeURIComponent(postId)}/reaction`,
      { kind },
    ),

  addComment: (postId: string, body: string, parentId: string | null) =>
    apiClient.post<{ id: string }>(
      `/community/posts/${encodeURIComponent(postId)}/comments`,
      { body, parentId },
    ),

  removeComment: (commentId: string) =>
    apiClient.delete<{ ok: boolean }>(
      `/community/comments/${encodeURIComponent(commentId)}`,
    ),

  moderatePost: (
    postId: string,
    decision: "published" | "rejected",
    version: number,
    reason: string,
  ) =>
    apiClient.post<{ ok: boolean }>(
      `/community/posts/${encodeURIComponent(postId)}/moderate`,
      { decision, version, reason },
    ),

  reportPost: (postId: string, reason: string, commentId: string | null) =>
    apiClient.post<{ ok: boolean }>(
      `/community/posts/${encodeURIComponent(postId)}/reports`,
      { reason, commentId },
    ),

  resolveReport: (reportId: string, hide: boolean) =>
    apiClient.patch<{ ok: boolean }>(
      `/community/reports/${encodeURIComponent(reportId)}`,
      { hide },
    ),
};
