import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "../../domain/types";
import type { Comment, PostInput, Reaction, SocialData } from "../types";
import { communityDataSource } from "./dataSource";
import type { ReactionKind } from "./api";

export type CommunityDataUpdater = (
  updater: (current: SocialData) => SocialData,
) => void;

function messageOf(error: unknown) {
  return error instanceof Error ? error.message : "Community request failed.";
}

export function useCommunityPosts(user: User | null) {
  const [data, setData] = useState<SocialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const next = await communityDataSource.feed(user);
      setData(next);
      setError("");
      return next;
    } catch (cause) {
      setError(messageOf(cause));
      throw cause;
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
    void reload().catch(() => undefined);
  }, [reload]);

  const updateData = useCallback<CommunityDataUpdater>((updater) => {
    setData((current) => (current ? updater(current) : current));
  }, []);

  const savePost = useCallback(
    async (input: PostInput, id?: string, version?: number) => {
      await communityDataSource.savePost(user, input, id, version);
      await reload();
    },
    [user?.id, reload],
  );

  const removePost = useCallback(
    async (id: string) => {
      await communityDataSource.removePost(user, id);
      await reload();
    },
    [user?.id, reload],
  );

  const moderatePost = useCallback(
    async (
      postId: string,
      decision: "published" | "rejected",
      version: number,
      reason: string,
    ) => {
      await communityDataSource.moderatePost(
        user,
        postId,
        decision,
        version,
        reason,
      );
      await reload();
    },
    [user?.id, reload],
  );

  const reportPost = useCallback(
    async (postId: string, reason: string, commentId: string | null) => {
      await communityDataSource.reportPost(user, postId, reason, commentId);
      await reload();
    },
    [user?.id, reload],
  );

  const resolveReport = useCallback(
    async (reportId: string, hide: boolean) => {
      await communityDataSource.resolveReport(user, reportId, hide);
      await reload();
    },
    [user?.id, reload],
  );

  return {
    data,
    loading,
    error,
    reload,
    updateData,
    savePost,
    removePost,
    moderatePost,
    reportPost,
    resolveReport,
  };
}

function setUserReaction(
  reactions: Reaction[],
  postId: string,
  userId: string,
  kind: ReactionKind,
) {
  const withoutMine = reactions.filter(
    (reaction) => !(reaction.postId === postId && reaction.userId === userId),
  );

  return kind
    ? [...withoutMine, { postId, userId, kind }]
    : withoutMine;
}

export function useReaction({
  postId,
  user,
  data,
  updateData,
  onError,
}: {
  postId: string;
  user: User | null;
  data: SocialData;
  updateData: CommunityDataUpdater;
  onError: (message: string) => void;
}) {
  const [pending, setPending] = useState(false);

  const reactions = useMemo(
    () => data.reactions.filter((reaction) => reaction.postId === postId),
    [data.reactions, postId],
  );

  const mine = reactions.find((reaction) => reaction.userId === user?.id)?.kind;

  const setReaction = useCallback(
    async (kind: Exclude<ReactionKind, null>) => {
      if (!user || pending) return;

      const previous = mine || null;
      const next: ReactionKind = previous === kind ? null : kind;

      updateData((current) => ({
        ...current,
        reactions: setUserReaction(current.reactions, postId, user.id, next),
      }));
      setPending(true);

      try {
        await communityDataSource.setReaction(user, postId, next);
      } catch (cause) {
        updateData((current) => ({
          ...current,
          reactions: setUserReaction(
            current.reactions,
            postId,
            user.id,
            previous,
          ),
        }));
        onError(messageOf(cause));
      } finally {
        setPending(false);
      }
    }, [user?.id, postId, pending, mine, updateData, onError]);

  return {
    mine,
    pending,
    likeCount: reactions.filter((reaction) => reaction.kind === "like").length,
    heartCount: reactions.filter((reaction) => reaction.kind === "heart").length,
    setReaction,
  };
}

export function usePostComments({
  postId,
  user,
  data,
  updateData,
  onSuccess,
  onError,
}: {
  postId: string;
  user: User | null;
  data: SocialData;
  updateData: CommunityDataUpdater;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [removingIds, setRemovingIds] = useState<Set<string>>(() => new Set());

  const comments = useMemo(
    () => data.comments.filter((comment) => comment.postId === postId),
    [data.comments, postId],
  );

  const roots = useMemo(
    () => comments.filter((comment) => !comment.parentId),
    [comments],
  );

  const addComment = useCallback(
    async (body: string, parentId: string | null) => {
      if (!user || adding) return false;
      setAdding(true);
      try {
        const created = await communityDataSource.addComment(
          user,
          postId,
          body,
          parentId,
        );
        updateData((current) => ({
          ...current,
          comments: [...current.comments, created],
        }));
        onSuccess("Comment added.");
        return true;
      } catch (cause) {
        onError(messageOf(cause));
        return false;
      } finally {
        setAdding(false);
      }
    }, [user?.id, adding, postId, updateData, onSuccess, onError]);

  const removeComment = useCallback(
    async (comment: Comment) => {
      if (!user || removingIds.has(comment.id)) return false;

      setRemovingIds((current) => new Set(current).add(comment.id));
      try {
        await communityDataSource.removeComment(user, comment.id);
        updateData((current) => ({
          ...current,
          comments: current.comments.map((item) =>
            item.id === comment.id
              ? { ...item, hidden: true, body: "Comment removed." }
              : item,
          ),
        }));
        onSuccess("Comment removed.");
        return true;
      } catch (cause) {
        onError(messageOf(cause));
        return false;
      } finally {
        setRemovingIds((current) => {
          const next = new Set(current);
          next.delete(comment.id);
          return next;
        });
      }
    }, [user?.id, removingIds, updateData, onSuccess, onError]);

  return {
    comments,
    roots,
    adding,
    removingIds,
    addComment,
    removeComment,
    visibleCount: comments.filter((comment) => !comment.hidden).length,
  };
}
