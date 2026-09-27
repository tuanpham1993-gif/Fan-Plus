import React from "react";
import { Icon } from "../../components/ui.js";
import { navigate } from "../../lib/router.js";
import { useAuth } from "../auth/AuthProvider.js";
import { useContentRating } from "./hooks.js";
export function ContentRating({ contentId, initial, }) {
    const { user } = useAuth();
    const { rating, pending, rate } = useContentRating(contentId, initial);
    const choose = (value) => {
        if (!user) {
            navigate(`/login?next=${encodeURIComponent(`/content/${contentId}`)}`);
            return;
        }
        void rate(value);
    };
    return (React.createElement("section", { className: "rating-panel" },
        React.createElement("div", null,
            React.createElement("h2", null, "Worth the discovery?"),
            React.createElement("p", { "aria-live": "polite" }, rating.count
                ? `${rating.count} rating${rating.count > 1 ? "s" : ""} / ${rating.average.toFixed(1)} average`
                : "Be the first to rate this entry.")),
        React.createElement("div", { role: "group", "aria-label": "Rate this content", className: "stars" }, [1, 2, 3, 4, 5].map((value) => (React.createElement("button", { type: "button", key: value, disabled: pending, "aria-label": `Rate ${value} out of 5`, "aria-pressed": rating.userRating === value, onClick: () => choose(value) },
            React.createElement(Icon, { name: "star", size: 25, fill: value <= rating.userRating ? "currentColor" : "none" })))))));
}
