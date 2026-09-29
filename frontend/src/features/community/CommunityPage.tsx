import React, { useCallback, useState } from "react";
import { Button, Empty, Icon, Modal } from "../../components/ui";
import { currentPath, Link, navigate, useLocation } from "../../lib/router";
import { useApp } from "../../lib/store";
import { serverMode } from "../../shared/http/client";
import { useCommunityBookmarks } from "../bookmarks/hooks";
import { useAuth } from "../auth/AuthProvider";
import { openLore } from "../Lore";
import type { Post } from "../types";
import { CommunityFeed, type CommunityTab } from "./CommunityFeed";
import { useCommunityPosts } from "./hooks";
import { PostEditor } from "./PostEditor";
import { communityDate } from "./utils";

export default function CommunityPage() {
  const { user } = useAuth();
  const { notify } = useApp();
  const { params } = useLocation();
  const community = useCommunityPosts(user);
  const handleBookmarkError = useCallback(
    (message: string) => notify(message, "error"),
    [notify],
  );
  const bookmarks = useCommunityBookmarks({
    user,
    onError: handleBookmarkError,
  });

  const [tab, setTab] = useState<CommunityTab>(() =>
    user?.role === "admin" && params.get("view") === "review"
      ? "review"
      : user?.role === "admin" && params.get("view") === "reports"
        ? "reports"
        : "latest",
  );
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Post | undefined>();
  const [report, setReport] = useState<{
    postId: string;
    commentId: string | null;
  } | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportPending, setReportPending] = useState(false);
  const [reportActionId, setReportActionId] = useState<string | null>(null);

  function requireUser() {
    if (user) return true;
    navigate("/login?next=" + encodeURIComponent(currentPath()));
    return false;
  }

  function compose(post?: Post) {
    if (!requireUser()) return;
    setEditing(post);
    setEditorOpen(true);
  }

  const removePost = async (post: Post) => {
    try {
      await community.removePost(post.id);
      notify("Post hidden.");
      return true;
    } catch (error) {
      notify(error instanceof Error ? error.message : "Post could not be removed.", "error");
      return false;
    }
  };

  const moderate = async (
    post: Post,
    decision: "published" | "rejected",
    reason: string,
  ) => {
    try {
      await community.moderatePost(post.id, decision, post.version, reason);
      notify(
        decision === "published"
          ? "Post published to the community."
          : "Post returned with feedback.",
      );
      return true;
    } catch (error) {
      notify(error instanceof Error ? error.message : "Moderation failed.", "error");
      return false;
    }
  };

  const reportsPanel =
    tab === "reports" && user?.role === "admin" ? (
      <div className="report-queue">
        {community.data?.reports.filter((item) => !item.resolved).length === 0 && (
          <Empty
            title="The report queue is clear."
            description="Member reports will appear here for a human review."
          />
        )}
        {community.data?.reports
          .filter((item) => !item.resolved)
          .map((item) => (
            <article className="post-card report-card" key={item.id}>
              <span className="eyebrow">
                {item.commentId ? "COMMENT REPORT" : "POST REPORT"}
                {" / "}
                {communityDate(item.createdAt)}
              </span>
              <h2>{item.postTitle}</h2>
              <p className="muted small">
                Reported by <strong>{item.reporterName}</strong> / Content by{" "}
                <strong>{item.authorName}</strong>
              </p>
              <p>
                <strong>Reason: </strong>
                {item.reason}
              </p>
              {item.contentPreview && (
                <blockquote className="report-preview preserve-space">
                  {item.contentPreview}
                </blockquote>
              )}
              <div className="post-actions">
                <Button
                  disabled={reportActionId === item.id}
                  onClick={async () => {
                    setReportActionId(item.id);
                    try {
                      await community.resolveReport(item.id, true);
                      notify("Reported content hidden.");
                    } catch (error) {
                      notify(
                        error instanceof Error ? error.message : "Report action failed.",
                        "error",
                      );
                    } finally {
                      setReportActionId(null);
                    }
                  }}
                >
                  Hide content
                </Button>
                <Button
                  variant="secondary"
                  disabled={reportActionId === item.id}
                  onClick={async () => {
                    setReportActionId(item.id);
                    try {
                      await community.resolveReport(item.id, false);
                      notify("Report dismissed.");
                    } catch (error) {
                      notify(
                        error instanceof Error ? error.message : "Report action failed.",
                        "error",
                      );
                    } finally {
                      setReportActionId(null);
                    }
                  }}
                >
                  Dismiss report
                </Button>
              </div>
            </article>
          ))}
      </div>
    ) : undefined;

  return (
    <>
      <section className="community-intro">
        <div>
          <span className="eyebrow">THE FAN HUB COMMUNITY</span>
          <h1>
            Some stories stay.
            <br />
            <em>Let's talk about them.</em>
          </h1>
          <p>
            Reviews, videos, soundtracks, theories and fan-made perspectives.
            <br />Anime, games, film, TV, K-pop, comics, manga and cosplay.
          </p>
        </div>
        <div className="community-intro-note">
          <span className="serif-mark">Fh.</span>
          <span>
            A SHARED SPACE
            <br />
            FOR INDIVIDUAL VOICES
          </span>
        </div>
      </section>

      <CommunityFeed
        user={user}
        data={community.data}
        loading={community.loading}
        error={community.error}
        reload={community.reload}
        updateData={community.updateData}
        tab={tab}
        onTabChange={setTab}
        focusedPostId={params.get("post")}
        onCompose={() => compose()}
        onEdit={compose}
        onReport={(postId, commentId) => {
          if (!requireUser()) return;
          setReport({ postId, commentId });
          setReportReason("");
        }}
        requireUser={requireUser}
        isBookmarked={bookmarks.isBookmarked}
        isBookmarkPending={bookmarks.isPending}
        onBookmark={bookmarks.toggle}
        onRemovePost={removePost}
        onModerate={user?.role === "admin" ? moderate : undefined}
        reportsPanel={reportsPanel}
        rail={<CommunityRail bookmarkBackendSupported={bookmarks.backendSupported} />}
      />

      <PostEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        post={editing}
        onSave={async (input) => {
          try {
            await community.savePost(input, editing?.id, editing?.version);
            const isAdmin = user?.role === "admin";
            notify(
              isAdmin
                ? "Your post is published."
                : "Your post is awaiting moderation.",
            );
            setEditorOpen(false);
            setTab(isAdmin ? "latest" : "mine");
            return true;
          } catch (error) {
            notify(error instanceof Error ? error.message : "Post could not be saved.", "error");
            return false;
          }
        }}
      />

      <Modal
        open={!!report}
        onClose={() => setReport(null)}
        title="Report this content"
      >
        <p className="muted">
          A moderator will review the reason. Disagreeing with an opinion is
          not, on its own, a violation.
        </p>
        <label className="field">
          <span>Reason for reporting</span>
          <textarea
            rows={4}
            maxLength={500}
            minLength={5}
            value={reportReason}
            onChange={(event) => setReportReason(event.target.value)}
          />
        </label>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setReport(null)}>
            Cancel
          </Button>
          <Button
            busy={reportPending}
            disabled={reportReason.trim().length < 5}
            onClick={async () => {
              if (!report || reportPending) return;
              setReportPending(true);
              try {
                await community.reportPost(
                  report.postId,
                  reportReason,
                  report.commentId,
                );
                notify("Report sent for review.");
                setReport(null);
              } catch (error) {
                notify(
                  error instanceof Error ? error.message : "Report could not be sent.",
                  "error",
                );
              } finally {
                setReportPending(false);
              }
            }}
          >
            Send report
          </Button>
        </div>
      </Modal>
    </>
  );
}

function CommunityRail({
  bookmarkBackendSupported,
}: {
  bookmarkBackendSupported: boolean;
}) {
  return (
    <aside className="community-rail">
      <div className="rail-note">
        <span className="eyebrow">A LITTLE HOUSEKEEPING</span>
        <h2>
          Different takes.
          <br />
          Same respect.
        </h2>
        <p>
          Talk about the work, not the person. Mark spoilers. Give credit.
          Member posts and media are reviewed before they reach the feed.
        </p>
        <div className="rail-rule">
          <span>01</span>Be thoughtful, not hurtful.
        </div>
        <div className="rail-rule">
          <span>02</span>Let people discover the ending.
        </div>
        <div className="rail-rule">
          <span>03</span>Share your own words.
        </div>
        <small>
          Seeded conversations and names are illustrative. Counts reflect
          stored sample interactions, not a live audience.
        </small>
      </div>

      <p className="rail-runtime">
        {serverMode
          ? bookmarkBackendSupported
            ? "Community data and member interactions use the Flask API."
            : "Community data uses Flask. Post bookmarks await the Backend bookmark contract."
          : "Interactive browser prototype. Posts, reactions and bookmarks are stored on this device."}
      </p>
    </aside>
  );
}
