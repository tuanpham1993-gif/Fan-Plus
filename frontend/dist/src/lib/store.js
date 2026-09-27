import React, { createContext, useContext, useEffect, useState, useCallback, } from "react";
import { useAuth } from "../features/auth/AuthProvider.js";
import { LEGACY_DB_CHANGED_EVENT } from "../shared/auth/events.js";
import { repository } from "../services/repository.js";
const Context = createContext(null);
function pref(key, fallback) {
    try {
        return localStorage.getItem(key) || fallback;
    }
    catch {
        return fallback;
    }
}
export function AppProvider({ children }) {
    const { user: authUser } = useAuth();
    const [db, setDb] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState("");
    const [theme, setTheme] = useState(pref("fanhub.theme", "dark") === "light" ? "light" : "dark");
    const [fontScale, setScale] = useState(Math.max(1, Math.min(1.25, Number(pref("fanhub.font", "1")) || 1)));
    const [spoilerSafe, setSafe] = useState(pref("fanhub.spoilers", "true") === "true");
    const [notices, setNotices] = useState([]);
    const notify = useCallback((message, kind = "success") => {
        const id = Date.now() + Math.random();
        setNotices((n) => [...n.slice(-2), { id, message, kind }]);
        window.setTimeout(() => setNotices((n) => n.filter((x) => x.id !== id)), 4500);
    }, []);
    const reload = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            setDb(await repository.load());
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "Unable to load demo data.");
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        void reload();
        const sync = (e) => {
            if (e.key === "fanhub.demo.db.v1")
                void reload();
        };
        const syncLegacyDb = () => void reload();
        window.addEventListener("storage", sync);
        window.addEventListener(LEGACY_DB_CHANGED_EVENT, syncLegacyDb);
        return () => {
            window.removeEventListener("storage", sync);
            window.removeEventListener(LEGACY_DB_CHANGED_EVENT, syncLegacyDb);
        };
    }, [reload]);
    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        document.documentElement.style.fontSize = `${fontScale * 100}%`;
        try {
            localStorage.setItem("fanhub.theme", theme);
            localStorage.setItem("fanhub.font", String(fontScale));
            localStorage.setItem("fanhub.spoilers", String(spoilerSafe));
        }
        catch { }
    }, [theme, fontScale, spoilerSafe]);
    const perform = useCallback(async (op, message) => {
        try {
            setDb(await op());
            if (message)
                notify(message);
            return true;
        }
        catch (e) {
            notify(e instanceof Error
                ? e.message
                : "Something went wrong. Please retry.", "error");
            return false;
        }
    }, [notify]);
    // Legacy consumers still read `user` from useApp() in later refactor chunks.
    // Authentication status/identity is owned by AuthProvider; only non-security
    // display/profile fields are projected from the local compatibility shadow.
    const localUser = authUser && db
        ? db.users.find((candidate) => candidate.id === authUser.id) || null
        : null;
    const user = authUser
        ? localUser
            ? {
                ...localUser,
                id: authUser.id,
                email: authUser.email,
                role: authUser.role,
                suspended: authUser.suspended,
                verified: authUser.verified,
            }
            : authUser
        : null;
    return (React.createElement(Context.Provider, { value: {
            db,
            user,
            loading,
            error,
            theme,
            fontScale,
            spoilerSafe,
            notices,
            reload,
            perform,
            setDb,
            notify,
            toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
            setFontScale: (n) => setScale(Math.max(1, Math.min(1.25, n))),
            toggleSpoilers: () => setSafe((s) => !s),
        } }, children));
}
export function useApp() {
    const value = useContext(Context);
    if (!value)
        throw new Error("AppProvider is required.");
    return value;
}
