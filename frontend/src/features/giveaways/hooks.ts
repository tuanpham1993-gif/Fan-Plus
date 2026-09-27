import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import type { Campaign } from "../types";
import type { CampaignSummary } from "./api";
import { giveawayDataSource } from "./dataSource";
import { optimisticCampaignEntry } from "./state";

type GiveawayStatus = "loading" | "success" | "error";
type GiveawayAction = "freeze" | "draw" | null;

function messageOf(error: unknown) {
  return error instanceof Error
    ? error.message
    : "The quarterly gifts campaign could not be updated.";
}

export function useGiveaways(selectedCampaignId?: string) {
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [archive, setArchive] = useState<CampaignSummary[]>([]);
  const [status, setStatus] = useState<GiveawayStatus>("loading");
  const [error, setError] = useState("");
  const [entryPending, setEntryPending] = useState(false);
  const [actionPending, setActionPending] = useState<GiveawayAction>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setStatus("loading");
      setError("");
      try {
        const [nextCampaign, nextArchive] = await Promise.all([
          giveawayDataSource.detail(user, selectedCampaignId, signal),
          giveawayDataSource.list(signal),
        ]);
        if (signal?.aborted) return null;
        setCampaign(nextCampaign);
        setArchive(nextArchive);
        setStatus("success");
        return nextCampaign;
      } catch (cause) {
        if (!signal?.aborted) {
          setError(messageOf(cause));
          setStatus("error");
        }
        return null;
      }
    },
    [selectedCampaignId, user?.id],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const enter = useCallback(
    async (agree: boolean) => {
      if (!user) throw new Error("Please sign in to enter this quarter.");
      if (!campaign) throw new Error("The quarter is still loading.");
      if (entryPending || campaign.myEntry) return campaign;

      const previous = campaign;
      setError("");
      setEntryPending(true);
      setCampaign(optimisticCampaignEntry(previous, user));

      try {
        const authoritative = await giveawayDataSource.enter(
          user,
          previous.id,
          agree,
        );
        setCampaign(authoritative);
        setStatus("success");
        return authoritative;
      } catch (cause) {
        setCampaign(previous);
        const message = messageOf(cause);
        setError(message);
        setStatus("error");
        throw new Error(message);
      } finally {
        setEntryPending(false);
      }
    },
    [campaign, entryPending, user?.id],
  );

  const freeze = useCallback(async () => {
    if (!campaign) throw new Error("The quarter is still loading.");
    setActionPending("freeze");
    setError("");
    try {
      const next = await giveawayDataSource.freeze(user, campaign.id);
      setCampaign(next);
      setStatus("success");
      return next;
    } catch (cause) {
      const message = messageOf(cause);
      setError(message);
      setStatus("error");
      throw new Error(message);
    } finally {
      setActionPending(null);
    }
  }, [campaign, user?.id]);

  const draw = useCallback(async () => {
    if (!campaign) throw new Error("The quarter is still loading.");
    setActionPending("draw");
    setError("");
    try {
      const next = await giveawayDataSource.draw(user, campaign.id);
      setCampaign(next);
      setStatus("success");
      return next;
    } catch (cause) {
      const message = messageOf(cause);
      setError(message);
      setStatus("error");
      throw new Error(message);
    } finally {
      setActionPending(null);
    }
  }, [campaign, user?.id]);

  return {
    campaign,
    archive,
    status,
    error,
    entryPending,
    actionPending,
    reload: load,
    enter,
    freeze,
    draw,
  };
}
