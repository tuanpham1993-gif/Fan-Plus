import { apiClient, clearCsrf } from "../../shared/http/client.js";
export const authApi = {
    me: (signal) => apiClient.get("/auth/me", { signal }),
    async login(email, password) {
        const result = await apiClient.post("/auth/login", {
            email,
            password,
        });
        clearCsrf();
        return result;
    },
    register: (input) => apiClient.post("/auth/register", input),
    verify: (email, code) => apiClient.post("/auth/verify", { email, code }),
    resendVerification: (email) => apiClient.post("/auth/verify/resend", { email }),
    async logout() {
        try {
            return await apiClient.post("/auth/logout");
        }
        finally {
            clearCsrf();
        }
    },
};
