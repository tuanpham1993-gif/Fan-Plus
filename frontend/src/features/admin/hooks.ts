import { useCallback, useEffect, useState } from "react";
import type { Category, Content, FanEvent, FAQ } from "../../domain/types";
import { adminDataSource } from "./dataSource";
import type { AdminWorkspace } from "./types";

function messageOf(error: unknown) {
  return error instanceof Error ? error.message : "Administrator request failed.";
}

type WorkspaceUpdater = (current: AdminWorkspace) => AdminWorkspace;

export function useAdminDashboard(enabled: boolean) {
  const [data, setData] = useState<AdminWorkspace | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState("");
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(() => new Set());

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
    } catch (cause) {
      setError(messageOf(cause));
      throw cause;
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void reload().catch(() => undefined);
  }, [reload]);

  const mutate = useCallback(
    async (
      key: string,
      operation: () => Promise<AdminWorkspace>,
      optimistic?: WorkspaceUpdater,
    ) => {
      if (!data || pendingKeys.has(key)) return;
      const snapshot = data;

      if (optimistic) setData(optimistic(snapshot));
      setPendingKeys((current) => new Set(current).add(key));
      setError("");

      try {
        setData(await operation());
      } catch (cause) {
        setData(snapshot);
        setError(messageOf(cause));
        throw cause;
      } finally {
        setPendingKeys((current) => {
          const next = new Set(current);
          next.delete(key);
          return next;
        });
      }
    },
    [data, pendingKeys],
  );

  const saveContent = useCallback(
    (content: Content) =>
      mutate(
        `content:${content.id || "new"}`,
        () => adminDataSource.saveContent(content),
        content.id
          ? (current) => ({
              ...current,
              contents: current.contents.map((item) =>
                item.id === content.id ? content : item,
              ),
            })
          : undefined,
      ),
    [mutate],
  );

  const deleteContent = useCallback(
    (id: string) =>
      mutate(
        `content:${id}`,
        () => adminDataSource.deleteContent(id),
        (current) => ({
          ...current,
          contents: current.contents.filter((item) => item.id !== id),
        }),
      ),
    [mutate],
  );

  const saveCategory = useCallback(
    (category: Category) =>
      mutate(
        `category:${category.id || "new"}`,
        () => adminDataSource.saveCategory(category),
        category.id
          ? (current) => ({
              ...current,
              categories: current.categories.map((item) =>
                item.id === category.id ? category : item,
              ),
            })
          : undefined,
      ),
    [mutate],
  );

  const deleteCategory = useCallback(
    (id: string) =>
      mutate(
        `category:${id}`,
        () => adminDataSource.deleteCategory(id),
        (current) => ({
          ...current,
          categories: current.categories.filter((item) => item.id !== id),
        }),
      ),
    [mutate],
  );

  const saveEvent = useCallback(
    (event: FanEvent) =>
      mutate(
        `event:${event.id || "new"}`,
        () => adminDataSource.saveEvent(event),
        event.id
          ? (current) => ({
              ...current,
              events: current.events.map((item) =>
                item.id === event.id ? event : item,
              ),
            })
          : undefined,
      ),
    [mutate],
  );

  const deleteEvent = useCallback(
    (id: string) =>
      mutate(
        `event:${id}`,
        () => adminDataSource.deleteEvent(id),
        (current) => ({
          ...current,
          events: current.events.filter((item) => item.id !== id),
        }),
      ),
    [mutate],
  );

  const moderateSubmission = useCallback(
    (id: string, decision: "approved" | "rejected", reason: string) =>
      mutate(
        `submission:${id}`,
        () => adminDataSource.moderateSubmission(id, decision, reason),
        (current) => ({
          ...current,
          submissions: current.submissions.map((item) =>
            item.id === id ? { ...item, status: decision, reason } : item,
          ),
        }),
      ),
    [mutate],
  );

  const setUserStatus = useCallback(
    (id: string, suspended: boolean) =>
      mutate(
        `user:${id}`,
        () => adminDataSource.setUserStatus(id, suspended),
        (current) => ({
          ...current,
          users: current.users.map((item) =>
            item.id === id ? { ...item, suspended } : item,
          ),
        }),
      ),
    [mutate],
  );

  const resolveFeedback = useCallback(
    (id: string) =>
      mutate(
        `feedback:${id}`,
        () => adminDataSource.resolveFeedback(id),
        (current) => ({
          ...current,
          feedback: current.feedback.map((item) =>
            item.id === id ? { ...item, status: "resolved" } : item,
          ),
        }),
      ),
    [mutate],
  );

  const saveKnowledge = useCallback(
    (faq: FAQ) =>
      mutate(
        `knowledge:${faq.id || "new"}`,
        () => adminDataSource.saveKnowledge(faq),
        faq.id
          ? (current) => ({
              ...current,
              faqs: current.faqs.map((item) =>
                item.id === faq.id ? faq : item,
              ),
            })
          : undefined,
      ),
    [mutate],
  );

  const deleteKnowledge = useCallback(
    (id: string) =>
      mutate(
        `knowledge:${id}`,
        () => adminDataSource.deleteKnowledge(id),
        (current) => ({
          ...current,
          faqs: current.faqs.filter((item) => item.id !== id),
        }),
      ),
    [mutate],
  );

  return {
    data,
    loading,
    error,
    reload,
    isPending: (key: string) => pendingKeys.has(key),
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
