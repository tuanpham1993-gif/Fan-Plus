import { apiClient } from "../../shared/http/client";
import type { Campaign } from "../types";

export interface CampaignSummary {
  id: string;
  title: string;
  status: string;
}

export interface GiveawayEntryResponse {
  ticket: string;
  alreadyEntered: boolean;
}

export const giveawayApi = {
  list: (signal?: AbortSignal) =>
    apiClient.get<CampaignSummary[]>("/giveaways", { signal }),

  detail: (campaignId = "current", signal?: AbortSignal) =>
    apiClient.get<Campaign>(
      `/giveaways/${encodeURIComponent(campaignId)}`,
      { signal },
    ),

  // Current Flask source exposes /entries (plural), not /enter.
  enter: (campaignId: string, agree: boolean) =>
    apiClient.post<GiveawayEntryResponse>(
      `/giveaways/${encodeURIComponent(campaignId)}/entries`,
      { agree },
    ),

  freeze: (campaignId: string) =>
    apiClient.post<unknown>(
      `/giveaways/${encodeURIComponent(campaignId)}/freeze`,
      {},
    ),

  draw: (campaignId: string) =>
    apiClient.post<unknown>(
      `/giveaways/${encodeURIComponent(campaignId)}/draw`,
      {},
    ),
};
