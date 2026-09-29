import { apiClient } from "../../shared/http/client.js";
export const eventApi = {
    list: (signal) => apiClient.get("/events", { signal }),
    join: (eventId) => apiClient.post(`/events/${encodeURIComponent(eventId)}/join`, {}),
};
