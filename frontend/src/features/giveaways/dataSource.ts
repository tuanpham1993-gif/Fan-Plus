import type { User } from "../../domain/types";
import { serverMode } from "../../shared/http/client";
import { demo } from "../demo";
import type { Campaign } from "../types";
import { giveawayApi, type CampaignSummary } from "./api";

export interface GiveawayDataSource {
  list(signal?: AbortSignal): Promise<CampaignSummary[]>;
  detail(
    user: User | null,
    campaignId?: string,
    signal?: AbortSignal,
  ): Promise<Campaign>;
  enter(user: User | null, campaignId: string, agree: boolean): Promise<Campaign>;
  freeze(user: User | null, campaignId: string): Promise<Campaign>;
  draw(user: User | null, campaignId: string): Promise<Campaign>;
}

const demoGiveawayDataSource: GiveawayDataSource = {
  list: () => demo.campaigns(),

  detail: (user, campaignId) => demo.campaign(user, campaignId),

  async enter(user, campaignId, agree) {
    await demo.enter(user, campaignId, agree);
    return demo.campaign(user, campaignId);
  },

  async freeze(user, campaignId) {
    await demo.freeze(user, campaignId);
    return demo.campaign(user, campaignId);
  },

  async draw(user, campaignId) {
    await demo.draw(user, campaignId);
    return demo.campaign(user, campaignId);
  },
};

const apiGiveawayDataSource: GiveawayDataSource = {
  list: (signal) => giveawayApi.list(signal),

  detail: (_user, campaignId, signal) =>
    giveawayApi.detail(campaignId || "current", signal),

  async enter(_user, campaignId, agree) {
    await giveawayApi.enter(campaignId, agree);
    return giveawayApi.detail(campaignId);
  },

  async freeze(_user, campaignId) {
    await giveawayApi.freeze(campaignId);
    return giveawayApi.detail(campaignId);
  },

  async draw(_user, campaignId) {
    await giveawayApi.draw(campaignId);
    return giveawayApi.detail(campaignId);
  },
};

export const giveawayDataSource = serverMode
  ? apiGiveawayDataSource
  : demoGiveawayDataSource;
