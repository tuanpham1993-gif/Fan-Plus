import { serverMode } from "../../shared/http/client.js";
import { demo } from "../demo.js";
import { giveawayApi } from "./api.js";
const demoGiveawayDataSource = {
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
const apiGiveawayDataSource = {
    list: (signal) => giveawayApi.list(signal),
    detail: (_user, campaignId, signal) => giveawayApi.detail(campaignId || "current", signal),
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
