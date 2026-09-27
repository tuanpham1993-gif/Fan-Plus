export function optimisticCampaignEntry(campaign, user, at = new Date().toISOString()) {
    if (campaign.myEntry)
        return campaign;
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
