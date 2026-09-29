import React from "react";
import { Icon } from "../../components/ui";
import { navigate } from "../../lib/router";
import { useAuth } from "../auth/AuthProvider";
import type { ContentRatingSummary } from "./api";
import { useContentRating } from "./hooks";

export function ContentRating({
  contentId,
  initial,
}: {
  contentId: string;
  initial: ContentRatingSummary;
}) {
  const { user } = useAuth();
  const { rating, pending, rate } = useContentRating(contentId, initial);

  const choose = (value: number) => {
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(`/content/${contentId}`)}`);
      return;
    }
    void rate(value);
  };

  return (
    <section className="rating-panel">
      <div>
        <h2>Worth the discovery?</h2>
        <p aria-live="polite">
          {rating.count
            ? `${rating.count} rating${rating.count > 1 ? "s" : ""} / ${rating.average.toFixed(1)} average`
            : "Be the first to rate this entry."}
        </p>
      </div>
      <div role="group" aria-label="Rate this content" className="stars">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            type="button"
            key={value}
            disabled={pending}
            aria-label={`Rate ${value} out of 5`}
            aria-pressed={rating.userRating === value}
            onClick={() => choose(value)}
          >
            <Icon
              name="star"
              size={25}
              fill={value <= rating.userRating ? "currentColor" : "none"}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
