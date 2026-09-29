import { apiClient } from "../../shared/http/client.js";
export const giveawayApi = {
    list: (signal) => apiClient.get("/giveaways", { signal }),
    detail: (campaignId = "current", signal) => apiClient.get(`/giveaways/${encodeURIComponent(campaignId)}`, { signal }),
    enter: (campaignId, agree) => apiClient.post(`/giveaways/${encodeURIComponent(campaignId)}/entries`, { agree }),
    freeze: (campaignId) => apiClient.post(`/giveaways/${encodeURIComponent(campaignId)}/freeze`, {}),
    draw: (campaignId) => apiClient.post(`/giveaways/${encodeURIComponent(campaignId)}/draw`, {}),
};
