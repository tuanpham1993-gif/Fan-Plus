import React, { useCallback, useState } from "react";
import { Button, Empty, Icon, Modal } from "../../components/ui.js";
import { currentPath, Link, navigate, useLocation } from "../../lib/router.js";
import { useApp } from "../../lib/store.js";
import { serverMode } from "../../shared/http/client.js";
import { useCommunityBookmarks } from "../bookmarks/hooks.js";
import { useAuth } from "../auth/AuthProvider.js";
import { openLore } from "../Lore.js";
import { CommunityFeed } from "./CommunityFeed.js";
import { useCommunityPosts } from "./hooks.js";
import { PostEditor } from "./PostEditor.js";
import { communityDate } from "./utils.js";
export default function CommunityPage() {
    const { user } = useAuth();
    const { notify } = useApp();
    const { params } = useLocation();
    const community = useCommunityPosts(user);
    const handleBookmarkError = useCallback((message) => notify(message, "error"), [notify]);
    const bookmarks = useCommunityBookmarks({
        user,
        onError: handleBookmarkError,
    });
    const [tab, setTab] = useState(() => user?.role === "admin" && params.get("view") === "review"
        ? "review"
        : user?.role === "admin" && params.get("view") === "reports"
            ? "reports"
            : "latest");
    const [editorOpen, setEditorOpen] = useState(false);
    const [editing, setEditing] = useState();
    const [report, setReport] = useState(null);
    const [reportReason, setReportReason] = useState("");
    const [reportPending, setReportPending] = useState(false);
    const [reportActionId, setReportActionId] = useState(null);
    function requireUser() {
        if (user)
            return true;
        navigate("/login?next=" + encodeURIComponent(currentPath()));
        return false;
    }
    function compose(post) {
        if (!requireUser())
            return;
        setEditing(post);
        setEditorOpen(true);
    }
    const removePost = async (post) => {
        try {
            await community.removePost(post.id);
            notify("Post hidden.");
            return true;
        }
        catch (error) {
            notify(error instanceof Error ? error.message : "Post could not be removed.", "error");
            return false;
        }
    };
    const moderate = async (post, decision, reason) => {
        try {
            await community.moderatePost(post.id, decision, post.version, reason);
            notify(decision === "published"
                ? "Post published to the community."
                : "Post returned with feedback.");
            return true;
        }
        catch (error) {
            notify(error instanceof Error ? error.message : "Moderation failed.", "error");
            return false;
        }
    };
    const reportsPanel = tab === "reports" && user?.role === "admin" ? (React.createElement("div", { className: "report-queue" },
        community.data?.reports.filter((item) => !item.resolved).length === 0 && (React.createElement(Empty, { title: "The report queue is clear.", description: "Member reports will appear here for a human review." })),
        community.data?.reports
            .filter((item) => !item.resolved)
            .map((item) => (React.createElement("article", { className: "post-card report-card", key: item.id },
            React.createElement("span", { className: "eyebrow" },
                item.commentId ? "COMMENT REPORT" : "POST REPORT",
                " / ",
                communityDate(item.createdAt)),
            React.createElement("h2", null, item.postTitle),
            React.createElement("p", { className: "muted small" },
                "Reported by ",
                React.createElement("strong", null, item.reporterName),
                " / Content by",
                " ",
                React.createElement("strong", null, item.authorName)),
            React.createElement("p", null,
                React.createElement("strong", null, "Reason: "),
                item.reason),
            item.contentPreview && (React.createElement("blockquote", { className: "report-preview preserve-space" }, item.contentPreview)),
            React.createElement("div", { className: "post-actions" },
                React.createElement(Button, { disabled: reportActionId === item.id, onClick: async () => {
                        setReportActionId(item.id);
                        try {
                            await community.resolveReport(item.id, true);
                            notify("Reported content hidden.");
                        }
                        catch (error) {
                            notify(error instanceof Error ? error.message : "Report action failed.", "error");
                        }
                        finally {
                            setReportActionId(null);
                        }
                    } }, "Hide content"),
                React.createElement(Button, { variant: "secondary", disabled: reportActionId === item.id, onClick: async () => {
                        setReportActionId(item.id);
                        try {
                            await community.resolveReport(item.id, false);
                            notify("Report dismissed.");
                        }
                        catch (error) {
                            notify(error instanceof Error ? error.message : "Report action failed.", "error");
                        }
                        finally {
                            setReportActionId(null);
                        }
                    } }, "Dismiss report"))))))) : undefined;
    return (React.createElement(React.Fragment, null,
        React.createElement("section", { className: "community-intro" },
            React.createElement("div", null,
                React.createElement("span", { className: "eyebrow" }, "THE FAN HUB COMMUNITY"),
                React.createElement("h1", null,
                    "Some stories stay.",
                    React.createElement("br", null),
                    React.createElement("em", null, "Let's talk about them.")),
                React.createElement("p", null,
                    "Reviews, videos, soundtracks, theories and fan-made perspectives.",
                    React.createElement("br", null),
                    "Anime, games, film, TV, K-pop, comics, manga and cosplay.")),
            React.createElement("div", { className: "community-intro-note" },
                React.createElement("span", { className: "serif-mark" }, "Fh."),
                React.createElement("span", null,
                    "A SHARED SPACE",
                    React.createElement("br", null),
                    "FOR INDIVIDUAL VOICES"))),
        React.createElement(CommunityFeed, { user: user, data: community.data, loading: community.loading, error: community.error, reload: community.reload, updateData: community.updateData, tab: tab, onTabChange: setTab, focusedPostId: params.get("post"), onCompose: () => compose(), onEdit: compose, onReport: (postId, commentId) => {
                if (!requireUser())
                    return;
                setReport({ postId, commentId });
                setReportReason("");
            }, requireUser: requireUser, isBookmarked: bookmarks.isBookmarked, isBookmarkPending: bookmarks.isPending, onBookmark: bookmarks.toggle, onRemovePost: removePost, onModerate: user?.role === "admin" ? moderate : undefined, reportsPanel: reportsPanel, rail: React.createElement(CommunityRail, { bookmarkBackendSupported: bookmarks.backendSupported }) }),
        React.createElement(PostEditor, { open: editorOpen, onClose: () => setEditorOpen(false), post: editing, onSave: async (input) => {
                try {
                    await community.savePost(input, editing?.id, editing?.version);
                    const isAdmin = user?.role === "admin";
                    notify(isAdmin
                        ? "Your post is published."
                        : "Your post is awaiting moderation.");
                    setEditorOpen(false);
                    setTab(isAdmin ? "latest" : "mine");
                    return true;
                }
                catch (error) {
                    notify(error instanceof Error ? error.message : "Post could not be saved.", "error");
                    return false;
                }
            } }),
        React.createElement(Modal, { open: !!report, onClose: () => setReport(null), title: "Report this content" },
            React.createElement("p", { className: "muted" }, "A moderator will review the reason. Disagreeing with an opinion is not, on its own, a violation."),
            React.createElement("label", { className: "field" },
                React.createElement("span", null, "Reason for reporting"),
                React.createElement("textarea", { rows: 4, maxLength: 500, minLength: 5, value: reportReason, onChange: (event) => setReportReason(event.target.value) })),
            React.createElement("div", { className: "modal-actions" },
                React.createElement(Button, { variant: "secondary", onClick: () => setReport(null) }, "Cancel"),
                React.createElement(Button, { busy: reportPending, disabled: reportReason.trim().length < 5, onClick: async () => {
                        if (!report || reportPending)
                            return;
                        setReportPending(true);
                        try {
                            await community.reportPost(report.postId, reportReason, report.commentId);
                            notify("Report sent for review.");
                            setReport(null);
                        }
                        catch (error) {
                            notify(error instanceof Error ? error.message : "Report could not be sent.", "error");
                        }
                        finally {
                            setReportPending(false);
                        }
                    } }, "Send report")))));
}
function CommunityRail({ bookmarkBackendSupported, }) {
    return (React.createElement("aside", { className: "community-rail" },
        React.createElement("div", { className: "rail-note" },
            React.createElement("span", { className: "eyebrow" }, "A LITTLE HOUSEKEEPING"),
            React.createElement("h2", null,
                "Different takes.",
                React.createElement("br", null),
                "Same respect."),
            React.createElement("p", null, "Talk about the work, not the person. Mark spoilers. Give credit. Member posts and media are reviewed before they reach the feed."),
            React.createElement("div", { className: "rail-rule" },
                React.createElement("span", null, "01"),
                "Be thoughtful, not hurtful."),
            React.createElement("div", { className: "rail-rule" },
                React.createElement("span", null, "02"),
                "Let people discover the ending."),
            React.createElement("div", { className: "rail-rule" },
                React.createElement("span", null, "03"),
                "Share your own words."),
            React.createElement("small", null, "Seeded conversations and names are illustrative. Counts reflect stored sample interactions, not a live audience.")),
        React.createElement("div", { className: "rail-lore" },
            React.createElement("span", { className: "lore-monogram" },
                "L",
                React.createElement("span", null, "m")),
            React.createElement("h3", null, "Need a little context?"),
            React.createElement("p", null, "Ask Lore Master about a character, a story, or how to shape your review."),
            React.createElement("button", { onClick: () => openLore("How do I write a thoughtful film review?") },
                "Ask Lore Master",
                React.createElement(Icon, { name: "arrow", size: 17 }))),
        React.createElement(Link, { to: "/giveaways", className: "rail-gift" },
            React.createElement("div", null,
                React.createElement(Icon, { name: "ticket", size: 23 }),
                React.createElement("span", { className: "eyebrow" }, "QUARTERLY GIFTS / DEMO")),
            React.createElement("h3", null, "Beyond the screen."),
            React.createElement("p", null, "One free entry. A few possibilities."),
            React.createElement("span", { className: "text-link" },
                "Explore this quarter",
                React.createElement(Icon, { name: "arrow", size: 16 }))),
        React.createElement("p", { className: "rail-runtime" }, serverMode
            ? bookmarkBackendSupported
                ? "Community data and member interactions use the Flask API."
                : "Community data uses Flask. Post bookmarks await the Backend bookmark contract."
            : "Interactive browser prototype. Posts, reactions and bookmarks are stored on this device.")));
}
