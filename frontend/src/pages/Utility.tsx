import React from "react";
import { useApp } from "../lib/store";
import { Link } from "../lib/router";
import { PageHeading, Icon, Empty, Crumbs, Notice } from "../components/ui";
const groups = [
  {
    title: "Discover",
    links: [
      ["/", "Home"],
      ["/explore", "All discoveries"],
      ["/media", "Multimedia center"],
      ["/characters", "Character profiles"],
      ["/showcase", "Merchandise showcase"],
      ["/releases", "Release calendar"],
      ["/events", "Events, calendar and map"],
      ["/community", "Community conversations"],
      ["/giveaways", "Quarterly gifts"],
    ],
  },
  {
    title: "Your workspace",
    links: [
      ["/dashboard", "Personal dashboard"],
      ["/collection", "Bookmarks and private notes"],
      ["/profile", "Profile and reading preferences"],
      ["/submit", "Submit a fan story"],
    ],
  },
  {
    title: "Help and access",
    links: [
      ["/assistant", "Lore Master workspace"],
      ["/feedback", "Feedback and FAQs"],
      ["/terms", "Terms of service"],
      ["/privacy", "Demo privacy information"],
      ["/login", "Sign in"],
      ["/register", "Register"],
      ["/forgot-password", "Password reset"],
      ["/verify-email", "Email verification handoff"],
    ],
  },
  {
    title: "Administration",
    links: [
      ["/admin", "Admin overview"],
      ["/admin?tab=content", "Content and media"],
      ["/admin?tab=categories", "Categories"],
      ["/admin?tab=events", "Events"],
      ["/admin?tab=submissions", "Fan review queue"],
      ["/admin?tab=users", "User management"],
      ["/admin?tab=feedback", "Feedback management"],
      ["/admin?tab=knowledge", "Knowledge base"],
    ],
  },
];
export default function Utility({ mode }: { mode: string }) {
  const { db } = useApp();
  if (mode === "sitemap")
    return (
      <>
        <Crumbs items={[{ label: "Sitemap" }]} />
        <PageHeading
          eyebrow="EVERY PATH THROUGH THE UNIVERSE"
          title="Find your way."
          description="A complete navigation map. Personal pages require sign-in and editorial tools require the demo administrator."
        />
        <div className="sitemap-grid">
          {groups.map((g) => (
            <section className="panel" key={g.title}>
              <h2>{g.title}</h2>
              {g.links.map(([to, label]) => (
                <Link className="sitemap-link" to={to} key={to}>
                  {label}
                  <Icon name="arrow" size={15} />
                </Link>
              ))}
            </section>
          ))}
        </div>
        <section className="panel">
          <h2>Browse by category</h2>
          <div className="tag-list">
            {db?.categories.map((c) => (
              <Link to={"/explore?category=" + c.id} key={c.id} className="tag">
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      </>
    );
  if (mode === "terms")
    return (
      <>
        <Crumbs items={[{ label: "Terms of service" }]} />
        <PageHeading
          eyebrow="WHAT YOU AGREE TO"
          title="Community terms of service."
          description="The rules every member accepts when creating an account or posting in the community."
        />
        <article className="panel prose">
          <h2>1. Your account</h2>
          <p>
            You must provide a real, working email address you control. Disposable
            or throwaway addresses are rejected, and the address must be verified
            with a one-time code before you can post, comment, react or enter a
            giveaway. You are responsible for activity under your account.
          </p>
          <h2>2. Community content</h2>
          <p>
            Posts, comments and media must be your own words or something you
            have the right to share. Content must not include sensitive,
            explicit, non-consensual or illegal imagery; posts containing
            flagged keywords are rejected automatically and may be reviewed by
            an administrator. Reviews and ratings must reflect a genuine
            perspective, not repeated or filler text used only to unlock a
            rating.
          </p>
          <h2>3. Moderation</h2>
          <p>
            New posts are reviewed before publication. Any member may report a
            post or comment; an administrator decides whether to hide it. Repeat
            or severe violations may lead to account suspension.
          </p>
          <h2>4. Quarterly gifts (demo)</h2>
          <p>
            The giveaway module in this kit is illustrative only. No purchase is
            necessary, no real prizes are shipped, and entries are recorded for
            demonstration purposes.
          </p>
          <h2>5. Changes</h2>
          <p>
            These terms may change as the product evolves. Continued use of the
            community after a change constitutes acceptance of the update. See
            also our <Link to="/privacy">privacy information</Link>.
          </p>
        </article>
      </>
    );
  if (mode === "privacy")
    return (
      <>
        <Crumbs items={[{ label: "Demo privacy" }]} />
        <PageHeading
          eyebrow="CLEAR BOUNDARIES, BETTER TRUST"
          title="Your data in this preview."
          description="This is an implementation note for the frontend prototype, not a production privacy policy."
        />
        <article className="panel prose">
          <h2>V3: two clearly separated modes</h2>
          <p>
            The Node preview stores community posts, reactions, comments,
            entries and Lore history on this device. In connected Flask mode,
            these three new modules and account authentication use the server
            database. The original V1 catalog tools remain local demonstrations.
            Browser state is never a trusted authorization source for Flask.
          </p>
          <p>
            The Lore provider is optional. If enabled by the operator, the
            current question, up to two previous user questions and retrieved
            editorial excerpts are sent to the configured AI provider. No email,
            password or prize entry list is sent to the model. Responses API
            requests use store=false; this does not, by itself, define the
            provider's complete retention policy. Server chat records are capped
            at 40 messages per identity; the operator must schedule the 30-day
            pruning command. Anonymous history uses a pseudonymous session;
            signed-in history is private to that account.
          </p>
          <h2>What stays on this browser</h2>
          <p>
            Profile edits, bookmarks, notes, ratings, fan stories, feedback,
            administrator edits and conversation history are stored in
            localStorage. A demo identity and demo password verifiers are stored
            in sessionStorage. Anyone with access to this browser or its
            developer tools can inspect or alter this data. Do not use a real
            password or enter private information.
          </p>
          <h2>What leaves this browser</h2>
          <p>
            In browser-preview mode, core browsing uses local files and makes no
            AI or backend requests. The connected extension mode is described
            above. If you explicitly enable the online map, the browser loads
            OpenStreetMap and sends ordinary network metadata such as your IP
            address to that provider. An organizer link opens the supplied
            external HTTPS website. Images you upload as a demo avatar are
            resized locally and are not uploaded to a server.
          </p>
          <h2>Location permission</h2>
          <p>
            Location is requested only when you press the nearby-events button.
            Coordinates remain in the current page's memory. They are not saved
            in the demo database. Denying permission leaves the city filter and
            calendar available. The map is centered on the selected fictional
            event, not your precise GPS position.
          </p>
          <h2>Reset and deletion</h2>
          <p>
            Use Clear conversation for the current Lore history. Profile &gt;
            Reset all demo data resets the original V1 catalog records only. To
            reset all V3 browser features, clear this site's browser storage.
            Server-side campaigns cannot be reset from the browser; this
            deliberately prevents rerolling a recorded result. Theme and font
            preferences remain. Clearing site storage in your browser also
            removes them. Deleted content is removed from related local
            bookmarks, ratings and reading history.
          </p>
          <h2>Before a public launch</h2>
          <p>
            The team must implement and validate server authorization, secure
            sessions, CSRF protection, verification and reset emails, data
            retention, consent controls, abuse prevention and a privacy policy
            that matches the deployed system. Local route guards are not
            security controls.
          </p>
          <Notice>
            Original fictional universes, illustrations, audio and event
            examples in this package are development fixtures. The Gojo note is
            explicitly labeled as an unverified illustrative lore example. There
            is no store, payment gateway or real event ticket inventory.
          </Notice>
        </article>
      </>
    );
  return (
    <Empty
      icon="globe"
      title="This world is still uncharted."
      description="The page does not exist, or this discovery is no longer available. Let's get you back to familiar ground."
    >
      <Link className="btn btn-primary" to="/">
        Back to discovery <Icon name="arrow" size={17} />
      </Link>
    </Empty>
  );
}
