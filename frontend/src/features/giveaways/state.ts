import type { User } from "../../domain/types";
import type { Campaign } from "../types";

export function optimisticCampaignEntry(
  campaign: Campaign,
  user: User,
  at = new Date().toISOString(),
): Campaign {
  if (campaign.myEntry) return campaign;
  return {
    ...campaign,
    entryCount: campaign.entryCount + 1,
    myEntry: {
      ticket: "PENDING",
      userId: user.id,
      joinedAt: at,
      termsVersion: campaign.termsVersion,
    },
  };
}
