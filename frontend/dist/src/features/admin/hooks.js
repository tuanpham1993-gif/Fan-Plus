import { useCallback, useEffect, useState } from "react";
import { adminDataSource } from "./dataSource.js";
function messageOf(error) {
    return error instanceof Error ? error.message : "Administrator request failed.";
}
export function useAdminDashboard(enabled) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(enabled);
    const [error, setError] = useState("");
    const [pendingKeys, setPendingKeys] = useState(() => new Set());
    const reload = useCallback(async () => {
        if (!enabled) {
            setData(null);
            setLoading(false);
            return null;
        }
        setLoading(true);
        try {
            const next = await adminDataSource.load();
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
    }, [enabled]);
    useEffect(() => {
        void reload().catch(() => undefined);
    }, [reload]);
    const mutate = useCallback(async (key, operation, optimistic) => {
        if (!data || pendingKeys.has(key))
            return;
        const snapshot = data;
        if (optimistic)
            setData(optimistic(snapshot));
        setPendingKeys((current) => new Set(current).add(key));
        setError("");
        try {
            setData(await operation());
        }
        catch (cause) {
            setData(snapshot);
            setError(messageOf(cause));
            throw cause;
        }
        finally {
            setPendingKeys((current) => {
                const next = new Set(current);
                next.delete(key);
                return next;
            });
        }
    }, [data, pendingKeys]);
    const saveContent = useCallback((content) => mutate(`content:${content.id || "new"}`, () => adminDataSource.saveContent(content), content.id
        ? (current) => ({
            ...current,
            contents: current.contents.map((item) => item.id === content.id ? content : item),
        })
        : undefined), [mutate]);
    const deleteContent = useCallback((id) => mutate(`content:${id}`, () => adminDataSource.deleteContent(id), (current) => ({
        ...current,
        contents: current.contents.filter((item) => item.id !== id),
    })), [mutate]);
    const saveCategory = useCallback((category) => mutate(`category:${category.id || "new"}`, () => adminDataSource.saveCategory(category), category.id
        ? (current) => ({
            ...current,
            categories: current.categories.map((item) => item.id === category.id ? category : item),
        })
        : undefined), [mutate]);
    const deleteCategory = useCallback((id) => mutate(`category:${id}`, () => adminDataSource.deleteCategory(id), (current) => ({
        ...current,
        categories: current.categories.filter((item) => item.id !== id),
    })), [mutate]);
    const saveEvent = useCallback((event) => mutate(`event:${event.id || "new"}`, () => adminDataSource.saveEvent(event), event.id
        ? (current) => ({
            ...current,
            events: current.events.map((item) => item.id === event.id ? event : item),
        })
        : undefined), [mutate]);
    const deleteEvent = useCallback((id) => mutate(`event:${id}`, () => adminDataSource.deleteEvent(id), (current) => ({
        ...current,
        events: current.events.filter((item) => item.id !== id),
    })), [mutate]);
    const moderateSubmission = useCallback((id, decision, reason) => mutate(`submission:${id}`, () => adminDataSource.moderateSubmission(id, decision, reason), (current) => ({
        ...current,
        submissions: current.submissions.map((item) => item.id === id ? { ...item, status: decision, reason } : item),
    })), [mutate]);
    const setUserStatus = useCallback((id, suspended) => mutate(`user:${id}`, () => adminDataSource.setUserStatus(id, suspended), (current) => ({
        ...current,
        users: current.users.map((item) => item.id === id ? { ...item, suspended } : item),
    })), [mutate]);
    const resolveFeedback = useCallback((id) => mutate(`feedback:${id}`, () => adminDataSource.resolveFeedback(id), (current) => ({
        ...current,
        feedback: current.feedback.map((item) => item.id === id ? { ...item, status: "resolved" } : item),
    })), [mutate]);
    const saveKnowledge = useCallback((faq) => mutate(`knowledge:${faq.id || "new"}`, () => adminDataSource.saveKnowledge(faq), faq.id
        ? (current) => ({
            ...current,
            faqs: current.faqs.map((item) => item.id === faq.id ? faq : item),
        })
        : undefined), [mutate]);
    const deleteKnowledge = useCallback((id) => mutate(`knowledge:${id}`, () => adminDataSource.deleteKnowledge(id), (current) => ({
        ...current,
        faqs: current.faqs.filter((item) => item.id !== id),
    })), [mutate]);
    return {
        data,
        loading,
        error,
        reload,
        isPending: (key) => pendingKeys.has(key),
        saveContent,
        deleteContent,
        saveCategory,
        deleteCategory,
        saveEvent,
        deleteEvent,
        moderateSubmission,
        setUserStatus,
        resolveFeedback,
        saveKnowledge,
        deleteKnowledge,
    };
}
