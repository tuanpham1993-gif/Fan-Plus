import { useCallback, useEffect, useRef, useState, } from "react";
import { ApiError } from "../../shared/http/client.js";
import { useAuth } from "../auth/AuthProvider.js";
import { loreDataSource } from "./dataSource.js";
import { appendLoreAssistantMessage, appendLoreUserMessage, loreModeLabel, } from "./state.js";
function messageOf(error) {
    if (error instanceof ApiError && error.status === 429) {
        return "Lore Master is receiving too many questions. Please wait a moment and try again.";
    }
    return error instanceof Error
        ? error.message
        : "The Lore Master request could not be completed.";
}
export function useLore(initialSpoilerSafe) {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState("");
    const [safe, setSafe] = useState(initialSpoilerSafe);
    const [topic, setTopic] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const [error, setError] = useState("");
    const [serviceMode, setServiceMode] = useState("Checking service");
    const requestController = useRef(null);
    const mounted = useRef(true);
    const load = useCallback(async (signal) => {
        setIsLoading(true);
        setError("");
        const [historyResult, statusResult] = await Promise.allSettled([
            loreDataSource.history(user, signal),
            loreDataSource.status(signal),
        ]);
        if (signal?.aborted || !mounted.current)
            return;
        if (historyResult.status === "fulfilled") {
            setMessages(historyResult.value);
        }
        else {
            setMessages([]);
            setError(messageOf(historyResult.reason));
        }
        if (statusResult.status === "fulfilled") {
            setServiceMode(loreModeLabel(statusResult.value.mode));
        }
        else {
            setServiceMode(loreModeLabel("service-unavailable"));
            if (historyResult.status === "fulfilled") {
                setError(messageOf(statusResult.reason));
            }
        }
        setIsLoading(false);
    }, [user?.id]);
    useEffect(() => {
        mounted.current = true;
        requestController.current?.abort();
        setIsTyping(false);
        const controller = new AbortController();
        void load(controller.signal);
        return () => {
            mounted.current = false;
            controller.abort();
            requestController.current?.abort();
        };
    }, [load]);
    const send = useCallback(async (rawQuestion) => {
        const question = rawQuestion.trim();
        if (!question || isTyping || isLoading)
            return false;
        if (question.length > 2000) {
            setError("Keep the question under 2,000 characters.");
            return false;
        }
        setError("");
        setDraft("");
        setIsTyping(true);
        const optimisticHistory = appendLoreUserMessage(messages, question);
        setMessages(optimisticHistory);
        requestController.current?.abort();
        const controller = new AbortController();
        requestController.current = controller;
        try {
            const result = await loreDataSource.send(user, {
                question,
                spoilerSafe: safe,
                topic,
            }, controller.signal);
            if (controller.signal.aborted || !mounted.current)
                return false;
            const completedHistory = appendLoreAssistantMessage(optimisticHistory, result);
            setMessages(completedHistory);
            await loreDataSource.persistDemoHistory(user, completedHistory);
            return true;
        }
        catch (cause) {
            if (!controller.signal.aborted && mounted.current) {
                setError(messageOf(cause));
            }
            return false;
        }
        finally {
            if (!controller.signal.aborted && mounted.current) {
                setIsTyping(false);
            }
        }
    }, [isLoading, isTyping, messages, safe, topic, user?.id]);
    const clearConversation = useCallback(async () => {
        if (isLoading || isTyping)
            return false;
        setError("");
        try {
            await loreDataSource.clear(user);
            if (!mounted.current)
                return false;
            setMessages([]);
            return true;
        }
        catch (cause) {
            if (mounted.current)
                setError(messageOf(cause));
            return false;
        }
    }, [isLoading, isTyping, user?.id]);
    const editLastQuestion = useCallback(() => {
        const last = [...messages].reverse().find((message) => message.role === "user");
        if (last)
            setDraft(last.text);
        setError("");
    }, [messages]);
    return {
        messages,
        draft,
        setDraft,
        safe,
        setSafe,
        topic,
        setTopic,
        isLoading,
        isTyping,
        error,
        clearError: () => setError(""),
        serviceMode,
        reload: load,
        send,
        clearConversation,
        editLastQuestion,
    };
}
export function useLoreSource(sourceId) {
    const [doc, setDoc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notFound, setNotFound] = useState(false);
    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError("");
        setNotFound(false);
        setDoc(null);
        void loreDataSource
            .source(sourceId, controller.signal)
            .then((result) => {
            if (!controller.signal.aborted)
                setDoc(result);
        })
            .catch((cause) => {
            if (controller.signal.aborted)
                return;
            const is404 = (cause instanceof ApiError && cause.status === 404) ||
                (typeof cause === "object" && cause !== null && "status" in cause && cause.status === 404);
            setNotFound(is404);
            setError(is404 ? "Source not found." : messageOf(cause));
        })
            .finally(() => {
            if (!controller.signal.aborted)
                setLoading(false);
        });
        return () => controller.abort();
    }, [sourceId]);
    return { doc, loading, error, notFound };
}
