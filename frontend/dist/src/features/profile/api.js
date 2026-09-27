import { apiClient } from "../../shared/http/client.js";
export const profileApi = {
    current: (signal) => apiClient.get("/auth/me", { signal }),
    update: (patch, signal) => apiClient.patch("/auth/profile", patch, { signal }),
    publicProfile: (id, signal) => apiClient.get(`/users/${encodeURIComponent(id)}`, { signal }),
};
