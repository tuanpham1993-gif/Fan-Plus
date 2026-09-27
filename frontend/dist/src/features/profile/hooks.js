import { useCallback, useEffect, useState } from "react";
import { useApp } from "../../lib/store.js";
import { useAuth } from "../auth/AuthProvider.js";
import { profileDataSource, } from "./dataSource.js";
function messageOf(error) {
    return error instanceof Error
        ? error.message
        : "Your profile could not be loaded.";
}
export function useProfileSettings() {
    const { user, adoptUser } = useAuth();
    const { setDb } = useApp();
    const [profile, setProfile] = useState(user);
    const [loading, setLoading] = useState(Boolean(user));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const load = useCallback(async (signal) => {
        if (!user) {
            setProfile(null);
            setLoading(false);
            setError("");
            return null;
        }
        setLoading(true);
        setError("");
        try {
            const next = await profileDataSource.current(user, signal);
            if (signal?.aborted)
                return null;
            setProfile(next);
            adoptUser(next);
            return next;
        }
        catch (cause) {
            if (!signal?.aborted)
                setError(messageOf(cause));
            return null;
        }
        finally {
            if (!signal?.aborted)
                setLoading(false);
        }
    }, [user?.id, adoptUser]);
    useEffect(() => {
        const controller = new AbortController();
        void load(controller.signal);
        return () => controller.abort();
    }, [load]);
    const save = useCallback(async (input) => {
        const current = profile || user;
        if (!current)
            throw new Error("Please sign in to edit your profile.");
        setSaving(true);
        setError("");
        try {
            const result = await profileDataSource.update(current, input);
            if (result.legacyDb)
                setDb(result.legacyDb);
            setProfile(result.user);
            adoptUser(result.user);
            return result;
        }
        catch (cause) {
            setError(messageOf(cause));
            throw cause;
        }
        finally {
            setSaving(false);
        }
    }, [profile, user?.id, adoptUser, setDb]);
    return {
        profile,
        loading,
        saving,
        error,
        reload: load,
        save,
    };
}
