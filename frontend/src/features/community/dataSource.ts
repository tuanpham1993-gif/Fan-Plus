import type { User } from "../../domain/types";
import { serverMode } from "../../shared/http/client";
import { demo } from "../demo";
import type { Comment, PostInput, SocialData } from "../types";
import { communityApi, type ReactionKind } from "./api";

export interface CommunityDataSource {
  feed(user: User | null, signal?: AbortSignal): Promise<SocialData>;
  savePost(
    user: User | null,
    input: PostInput,
    id?: string,
    version?: number,
  ): Promise<void>;
  removePost(user: User | null, id: string): Promise<void>;
  setReaction(
    user: User | null,
    postId: string,
    kind: ReactionKind,
  ): Promise<void>;
  addComment(
    user: User | null,
    postId: string,
    body: string,
    parentId: string | null,
  ): Promise<Comment>;
  removeComment(user: User | null, commentId: string): Promise<void>;
  moderatePost(
    user: User | null,
    postId: string,
    decision: "published" | "rejected",
    version: number,
    reason: string,
  ): Promise<void>;
  reportPost(
    user: User | null,
    postId: string,
    reason: string,
    commentId: string | null,
  ): Promise<void>;
  resolveReport(
    user: User | null,
    reportId: string,
    hide: boolean,
  ): Promise<void>;
}

const apiDataSource: CommunityDataSource = {
  feed: (_user, signal) => communityApi.feed(signal),

  async savePost(_user, input, id, version) {
    if (id) {
      if (typeof version !== "number") {
        throw new Error("Post version is required when editing.");
      }
      await communityApi.updatePost(id, input, version);
      return;
    }
    await communityApi.createPost(input);
  },

  async removePost(_user, id) {
    await communityApi.removePost(id);
  },

  async setReaction(_user, postId, kind) {
    await communityApi.setReaction(postId, kind);
  },

  async addComment(user, postId, body, parentId) {
    if (!user) throw new Error("Please sign in.");
    const result = await communityApi.addComment(postId, body, parentId);
    return {
      id: result.id,
      postId,
      authorId: user.id,
      authorName: user.name,
      body: body.trim(),
      parentId,
      createdAt: new Date().toISOString(),
      hidden: false,
    };
  },

  async removeComment(_user, commentId) {
    await communityApi.removeComment(commentId);
  },

  async moderatePost(_user, postId, decision, version, reason) {
    await communityApi.moderatePost(postId, decision, version, reason);
  },

  async reportPost(_user, postId, reason, commentId) {
    await communityApi.reportPost(postId, reason, commentId);
  },

  async resolveReport(_user, reportId, hide) {
    await communityApi.resolveReport(reportId, hide);
  },
};

const demoDataSource: CommunityDataSource = {
  feed: (user) => demo.social(user),

  async savePost(user, input, id, version) {
    await demo.post(user, input, id, version);
  },

  async removePost(user, id) {
    await demo.removePost(user, id);
  },

  async setReaction(user, postId, kind) {
    await demo.react(user, postId, kind);
  },

  async addComment(user, postId, body, parentId) {
    if (!user) throw new Error("Please sign in.");
    await demo.comment(user, postId, body, parentId);
    const snapshot = await demo.social(user);
    const match = [...snapshot.comments]
      .reverse()
      .find(
        (comment) =>
          comment.postId === postId &&
          comment.authorId === user.id &&
          comment.parentId === parentId &&
          comment.body === body.trim(),
      );
    if (!match) throw new Error("The comment could not be loaded after saving.");
    return match;
  },

  async removeComment(user, commentId) {
    await demo.removeComment(user, commentId);
  },

  async moderatePost(user, postId, decision, version, reason) {
    await demo.moderate(user, postId, decision, version, reason);
  },

  async reportPost(user, postId, reason, commentId) {
    await demo.report(user, postId, reason, commentId);
  },

  async resolveReport(user, reportId, hide) {
    await demo.resolveReport(user, reportId, hide);
  },
};

export const communityDataSource: CommunityDataSource = serverMode
  ? apiDataSource
  : demoDataSource;
