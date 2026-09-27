import { apiClient, clearCsrf } from "../../shared/http/client.js";
export const authApi = {
    me: (signal) => apiClient.get("/auth/me", { signal }),
    async login(email, password) {
        const result = await apiClient.post("/auth/login", {
            email,
            password,
        });
        // Flask clears/rotates the session during login, so the pre-login CSRF token
        // must never be reused for the authenticated session.
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
            // Logout clears the Flask session even though this request itself needs
            // the old session-bound CSRF token.
            clearCsrf();
        }
    },
};
