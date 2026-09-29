import { useCallback, useEffect, useMemo, useState } from "react";
import { communityDataSource } from "./dataSource.js";
function messageOf(error) {
    return error instanceof Error ? error.message : "Community request failed.";
}
export function useCommunityPosts(user) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const reload = useCallback(async () => {
        setLoading(true);
        try {
            const next = await communityDataSource.feed(user);
            setData(next);
            setError("");
            return next;
        }
        catch (cause) {
            setError(messageOf(cause));
            throw cause;
        }
        finally {
            setLoading(false);
        }
    }, [user?.id, user?.role]);
    useEffect(() => {
        void reload().catch(() => undefined);
    }, [reload]);
    const updateData = useCallback((updater) => {
        setData((current) => (current ? updater(current) : current));
    }, []);
    const savePost = useCallback(async (input, id, version) => {
        await communityDataSource.savePost(user, input, id, version);
        await reload();
    }, [user?.id, reload]);
    const removePost = useCallback(async (id) => {
        await communityDataSource.removePost(user, id);
        await reload();
    }, [user?.id, reload]);
    const moderatePost = useCallback(async (postId, decision, version, reason) => {
        await communityDataSource.moderatePost(user, postId, decision, version, reason);
        await reload();
    }, [user?.id, reload]);
    const reportPost = useCallback(async (postId, reason, commentId) => {
        await communityDataSource.reportPost(user, postId, reason, commentId);
        await reload();
    }, [user?.id, reload]);
    const resolveReport = useCallback(async (reportId, hide) => {
        await communityDataSource.resolveReport(user, reportId, hide);
        await reload();
    }, [user?.id, reload]);
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
function setUserReaction(reactions, postId, userId, kind) {
    const withoutMine = reactions.filter((reaction) => !(reaction.postId === postId && reaction.userId === userId));
    return kind
        ? [...withoutMine, { postId, userId, kind }]
        : withoutMine;
}
export function useReaction({ postId, user, data, updateData, onError, }) {
    const [pending, setPending] = useState(false);
    const reactions = useMemo(() => data.reactions.filter((reaction) => reaction.postId === postId), [data.reactions, postId]);
    const mine = reactions.find((reaction) => reaction.userId === user?.id)?.kind;
    const setReaction = useCallback(async (kind) => {
        if (!user || pending)
            return;
        const previous = mine || null;
        const next = previous === kind ? null : kind;
        updateData((current) => ({
            ...current,
            reactions: setUserReaction(current.reactions, postId, user.id, next),
        }));
        setPending(true);
        try {
            await communityDataSource.setReaction(user, postId, next);
        }
        catch (cause) {
            updateData((current) => ({
                ...current,
                reactions: setUserReaction(current.reactions, postId, user.id, previous),
            }));
            onError(messageOf(cause));
        }
        finally {
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
export function usePostComments({ postId, user, data, updateData, onSuccess, onError, }) {
    const [adding, setAdding] = useState(false);
    const [removingIds, setRemovingIds] = useState(() => new Set());
    const comments = useMemo(() => data.comments.filter((comment) => comment.postId === postId), [data.comments, postId]);
    const roots = useMemo(() => comments.filter((comment) => !comment.parentId), [comments]);
    const addComment = useCallback(async (body, parentId) => {
        if (!user || adding)
            return false;
        setAdding(true);
        try {
            const created = await communityDataSource.addComment(user, postId, body, parentId);
            updateData((current) => ({
                ...current,
                comments: [...current.comments, created],
            }));
            onSuccess("Comment added.");
            return true;
        }
        catch (cause) {
            onError(messageOf(cause));
            return false;
        }
        finally {
            setAdding(false);
        }
    }, [user?.id, adding, postId, updateData, onSuccess, onError]);
    const removeComment = useCallback(async (comment) => {
        if (!user || removingIds.has(comment.id))
            return false;
        setRemovingIds((current) => new Set(current).add(comment.id));
        try {
            await communityDataSource.removeComment(user, comment.id);
            updateData((current) => ({
                ...current,
                comments: current.comments.map((item) => item.id === comment.id
                    ? { ...item, hidden: true, body: "Comment removed." }
                    : item),
            }));
            onSuccess("Comment removed.");
            return true;
        }
        catch (cause) {
            onError(messageOf(cause));
            return false;
        }
        finally {
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
