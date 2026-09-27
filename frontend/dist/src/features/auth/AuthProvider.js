import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, } from "react";
import { repository } from "../../services/repository.js";
import { AUTH_SESSION_CHANGED_EVENT } from "../../shared/auth/events.js";
import { serverMode } from "../../shared/http/client.js";
import { authApi } from "./api.js";
const AuthContext = createContext(null);
function messageOf(error) {
    return error instanceof Error
        ? error.message
        : "Authentication could not be completed.";
}
export function AuthProvider({ children }) {
    const [status, setStatus] = useState("loading");
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);
    const applyUser = useCallback((next) => {
        setUser(next);
        setStatus(next ? "authenticated" : "unauthenticated");
        // Temporary compatibility only: untouched legacy account operations still use
        // the demo repository. Connected authentication never reads this shadow as
        // its source of truth; GET /auth/me remains authoritative.
        if (serverMode)
            repository.syncLegacyAuthShadow(next);
    }, []);
    const refresh = useCallback(async () => {
        setStatus("loading");
        setError(null);
        try {
            const next = serverMode
                ? (await authApi.me()).user
                : repository.currentSessionUser();
            applyUser(next);
            return next;
        }
        catch (cause) {
            setUser(null);
            setStatus("unauthenticated");
            setError(messageOf(cause));
            if (serverMode)
                repository.syncLegacyAuthShadow(null);
            return null;
        }
    }, [applyUser]);
    const login = useCallback(async (email, password) => {
        setError(null);
        try {
            const next = serverMode
                ? (await authApi.login(email, password)).user
                : repository.currentUser(await repository.login(email, password));
            if (!next)
                throw new Error("The authenticated user could not be loaded.");
            applyUser(next);
            return next;
        }
        catch (cause) {
            setError(messageOf(cause));
            throw cause;
        }
    }, [applyUser]);
    const logout = useCallback(async () => {
        setError(null);
        try {
            if (serverMode)
                await authApi.logout();
            else
                await repository.logout();
            applyUser(null);
        }
        catch (cause) {
            setError(messageOf(cause));
            throw cause;
        }
    }, [applyUser]);
    const adoptUser = useCallback((next) => {
        setError(null);
        applyUser(next);
    }, [applyUser]);
    useEffect(() => {
        void refresh();
    }, [refresh]);
    useEffect(() => {
        const resync = () => void refresh();
        window.addEventListener(AUTH_SESSION_CHANGED_EVENT, resync);
        return () => window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, resync);
    }, [refresh]);
    const value = useMemo(() => ({ status, user, error, refresh, login, logout, adoptUser }), [status, user, error, refresh, login, logout, adoptUser]);
    return React.createElement(AuthContext.Provider, { value: value }, children);
}
export function useAuth() {
    const value = useContext(AuthContext);
    if (!value)
        throw new Error("AuthProvider is required.");
    return value;
}
