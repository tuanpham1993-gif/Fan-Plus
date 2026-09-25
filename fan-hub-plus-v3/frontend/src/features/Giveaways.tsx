import React, { useEffect, useState, useCallback } from "react";
import { useApp } from "../lib/store";
import { Link, navigate } from "../lib/router";
import { Icon, Button, Modal, Empty } from "../components/ui";
import { gateway } from "./gateway";
import { serverMode } from "./http";
import { verifyCampaignRecord } from "./demo";
import type { Campaign, Prize } from "./types";
const format = (s: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(s));
function Countdown({ end }: { end: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, Date.parse(end) - now),
    d = Math.floor(diff / 86400000),
    h = Math.floor(diff / 3600000) % 24,
    m = Math.floor(diff / 60000) % 60;
  return (
    <div className="quarter-countdown" aria-label="Time until entry closes">
      {[
        [d, "DAYS"],
        [h, "HOURS"],
        [m, "MINUTES"],
      ].map(([v, l]) => (
        <div key={l}>
          <strong>{String(v).padStart(2, "0")}</strong>
          <span>{l}</span>
        </div>
      ))}
    </div>
  );
}
function PrizeArt({ prize: p }: { prize: Prize }) {
  return (
    <div
      className={"prize-art " + p.kind}
      aria-label={"Illustrative artwork for " + p.title}
    >
      <span className="prize-edition">FAN HUB JOURNEYS / 0{p.rank}</span>
      {p.kind === "seoul" ? (
        <>
          <span className="destination-type">SEOUL</span>
          <div className="city-sun" />
          <div className="city-silhouette" aria-hidden="true">
            {[35, 57, 76, 44, 92, 115, 53, 82, 62, 32].map((h, i) => (
              <span key={i} style={{ height: h + "px" }} />
            ))}
          </div>
          <div className="destination-footer">
            <span>
              A DIFFERENT KIND
              <br />
              OF DISCOVERY
            </span>
            <Icon name="globe" size={33} />
          </div>
        </>
      ) : p.kind === "dalat" ? (
        <>
          <span className="destination-type">DA LAT</span>
          <div className="mountain one" />
          <div className="mountain two" />
          <div className="mountain three" />
          <div className="destination-footer">
            <span>
              A LITTLE SLOWER.
              <br />A LITTLE CLOSER.
            </span>
            <Icon name="pin" size={28} />
          </div>
        </>
      ) : (
        <>
          <div className="cinema-lines" />
          <span className="destination-type">
            ONE
            <br />
            MORE
            <br />
            STORY.
          </span>
          <div className="destination-footer">
            <span>
              THE BIG SCREEN
              <br />
              IS CALLING
            </span>
            <Icon name="film" size={28} />
          </div>
        </>
      )}
    </div>
  );
}
export default function Giveaways() {
  const { user, notify } = useApp();
  const [campaign, setCampaign] = useState<Campaign | null>(null),
    [archive, setArchive] = useState<
      { id: string; title: string; status: string }[]
    >([]),
    [selected, setSelected] = useState(""),
    [error, setError] = useState(""),
    [tab, setTab] = useState("prizes"),
    [join, setJoin] = useState(false),
    [agree, setAgree] = useState(false),
    [age, setAge] = useState(false),
    [busy, setBusy] = useState(false),
    [verify, setVerify] = useState(""),
    [confirmDraw, setConfirmDraw] = useState(false),
    [confirmFreeze, setConfirmFreeze] = useState(false);
  const load = useCallback(async () => {
    try {
      setCampaign(await gateway.campaign(user, selected || undefined));
      setArchive(await gateway.campaigns());
      setError("");
      setVerify("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, [user?.id, selected]);
  useEffect(() => {
    void load();
  }, [load]);
  async function run(fn: () => Promise<unknown>, message: string) {
    setBusy(true);
    try {
      await fn();
      await load();
      notify(message);
      return true;
    } catch (e) {
      notify((e as Error).message, "error");
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function checkProof() {
    if (!campaign) return;
    try {
      const valid = await verifyCampaignRecord(campaign);
      setVerify(
        valid
          ? "Record consistency verified: seed commitment, snapshot and selected tickets match. This does not independently prove promoter fairness."
          : "Verification failed. Do not rely on this record.",
      );
    } catch (e) {
      setVerify((e as Error).message);
    }
  }
  if (error && !campaign)
    return (
      <Empty title="The quarter could not be loaded." description={error}>
        <Button onClick={() => void load()}>Try again</Button>
      </Empty>
    );
  if (!campaign)
    return (
      <div className="loading-page" role="status">
        <span className="spinner" />
        Opening this quarter...
      </div>
    );
  const c = campaign,
    open =
      c.status === "open" &&
      Date.now() >= Date.parse(c.opensAt) &&
      Date.now() < Date.parse(c.closesAt);
  return (
    <>
      <section className="gifts-intro">
        <div className="gifts-intro-copy">
          <span className="eyebrow">A SMALL THANK YOU, EVERY QUARTER</span>
          <h1>
            Beyond the screen.
            <br />
            <em>Into your next story.</em>
          </h1>
          <p>
            A community is made by the people who return.
            <br />
            Here is a little space for possibility.
          </p>
          <div className="gifts-flags">
            <span>
              <Icon name="ticket" size={16} />
              One free entry
            </span>
            <span>
              <Icon name="shield" size={16} />
              No purchase
            </span>
            <span>{c.title}</span>
          </div>
        </div>
        <div className="quarter-stamp">
          <span>FAN HUB</span>
          <strong>{c.id.split("-")[1]}</strong>
          <span>{c.id.split("-")[0]} / MEMBER APPRECIATION</span>
        </div>
      </section>
      <div className="giveaway-disclosure">
        <Icon name="info" size={18} />
        <p>
          <strong>Demonstration campaign.</strong> Travel and cinema prizes are
          illustrative proposals. No sponsor, live promotion or actual prize
          entitlement is claimed.
        </p>
      </div>
      <div className="gifts-tabs">
        <div role="group" aria-label="Quarterly gifts sections">
          {[
            ["prizes", "This quarter"],
            ["entry", "My entry"],
            ["results", "Results & record"],
            ["rules", "How it works"],
          ].map(([id, label]) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              aria-pressed={tab === id}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
        {archive.length > 1 && (
          <label>
            <span className="sr-only">Campaign archive</span>
            <select
              value={selected || c.id}
              onChange={(e) => setSelected(e.target.value)}
            >
              {archive.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </label>
        )}
        <span className={"quarter-state " + c.status}>
          <span className="live-dot" />
          {c.status === "drawn"
            ? "Result recorded"
            : c.status === "locked"
              ? "Entries locked"
              : open
                ? "Open for demo entries"
                : "Entries closed"}
        </span>
      </div>
      {tab === "prizes" && (
        <>
          <div className="gifts-layout">
            <section
              className="prizes-grid"
              aria-label="Illustrative quarterly prizes"
            >
              {c.prizes.map((p) => (
                <article key={p.id} className={"prize-card prize-" + p.rank}>
                  <PrizeArt prize={p} />
                  <div className="prize-info">
                    <span className="prize-rank">
                      0{p.rank}{" "}
                      <span>
                        /{" "}
                        {p.rank === 1
                          ? "FIRST PRIZE"
                          : p.rank === 2
                            ? "SECOND PRIZE"
                            : "THIRD PRIZE"}
                      </span>
                    </span>
                    <h2>{p.title}</h2>
                    <p>{p.subtitle}</p>
                    <small>
                      {p.kind === "seoul"
                        ? "Final itinerary, visa conditions and inclusions are not defined in this prototype."
                        : p.kind === "dalat"
                          ? "Dates, accommodation and transport are subject to a future approved prize specification."
                          : "Cinema, screening and validity must be specified before a live campaign."}
                    </small>
                  </div>
                </article>
              ))}
            </section>
            <aside className="entry-rail">
              <div className="entry-card">
                <span className="eyebrow">YOUR NEXT CHAPTER</span>
                <h2>
                  A single entry.
                  <br />
                  Equal possibilities.
                </h2>
                <p>
                  No points to chase. No extra entries for posting or liking.
                  Just one free entry per eligible account.
                </p>
                <span className="countdown-label">ENTRIES CLOSE IN</span>
                <Countdown end={c.closesAt} />
                {c.myEntry ? (
                  <div className="entry-success">
                    <Icon name="check" size={20} />
                    <strong>Your demo entry is recorded.</strong>
                    <code>{c.myEntry.ticket}</code>
                    <button onClick={() => setTab("entry")}>
                      View my ticket
                      <Icon name="arrow" size={16} />
                    </button>
                  </div>
                ) : (
                  <Button
                    disabled={!open || user?.role === "admin"}
                    onClick={() => {
                      if (!user) {
                        navigate("/login?next=/giveaways");
                        return;
                      }
                      setAgree(false);
                      setAge(false);
                      setJoin(true);
                    }}
                  >
                    {!open
                      ? "Entries are closed"
                      : user?.role === "admin"
                        ? "Promoters do not enter"
                        : "Enter this quarter"}
                    <Icon name="arrow" size={17} />
                  </Button>
                )}
                <div className="entry-meta">
                  <span>Entries recorded</span>
                  <strong>{c.entryCount}</strong>
                </div>
                <div className="entry-meta">
                  <span>Draw date (ICT)</span>
                  <strong>{format(c.drawAt)}</strong>
                </div>
                <button className="small-link" onClick={() => setTab("rules")}>
                  Read the participation rules
                  <Icon name="arrow" size={15} />
                </button>
              </div>
              <div className="entry-aside-note">
                <Icon name="book" size={21} />
                <p>
                  The draw happens on the server in connected mode. The
                  interface only reveals the recorded result.
                </p>
              </div>
            </aside>
          </div>
          <div className="quarter-steps">
            <div>
              <span>01</span>
              <h3>Make yourself at home.</h3>
              <p>Use an active member account. No payment is required.</p>
            </div>
            <div>
              <span>02</span>
              <h3>Choose to take part.</h3>
              <p>Read the rules and record one entry for the quarter.</p>
            </div>
            <div>
              <span>03</span>
              <h3>Return for the result.</h3>
              <p>Check the published ticket codes and the draw record.</p>
            </div>
          </div>
        </>
      )}
      {tab === "entry" && (
        <section className="my-entry-section">
          {!user ? (
            <Empty
              icon="ticket"
              title="A place for your next chapter."
              description="Sign in to view your own quarterly entry. Other members' private details are never shown."
            >
              <Link to="/login?next=/giveaways" className="btn btn-primary">
                Sign in
              </Link>
            </Empty>
          ) : c.myEntry ? (
            <div className="member-ticket">
              <div>
                <span className="eyebrow">FAN HUB / MEMBER ENTRY</span>
                <h2>{c.title}</h2>
                <p>One person. One free entry. No purchase.</p>
                <code>{c.myEntry.ticket}</code>
                <span>Recorded {format(c.myEntry.joinedAt)} ICT</span>
              </div>
              <aside>
                <Icon name="ticket" size={46} />
                <strong>DEMO</strong>
                <span>
                  {c.winners.some((w) => w.ticket === c.myEntry?.ticket)
                    ? "Selected in the demo draw"
                    : c.status === "drawn"
                      ? "Not selected this time"
                      : "Entry recorded"}
                </span>
              </aside>
            </div>
          ) : (
            <Empty
              icon="ticket"
              title="Your ticket is waiting."
              description="Read the rules, then choose to enter. Likes and comments never change the number of entries."
            >
              <Button onClick={() => setTab("prizes")}>
                Explore this quarter
              </Button>
            </Empty>
          )}
        </section>
      )}
      {tab === "results" && (
        <section className="results-section">
          <div className="results-heading">
            <span className="eyebrow">THIS QUARTER / THE DRAW RECORD</span>
            <h2>
              {c.status === "drawn"
                ? "The result is recorded."
                : "The next chapter is still unwritten."}
            </h2>
            <p>
              {c.status === "drawn"
                ? "Public results show random ticket codes, not email addresses or real names."
                : "Results will appear after entries are locked and an administrator completes the demo draw."}
            </p>
          </div>
          {c.status === "drawn" ? (
            <div className="winner-grid">
              {c.prizes.map((p) => {
                const w = c.winners.find((w) => w.prizeId === p.id);
                return (
                  <article key={p.id}>
                    <span className="eyebrow">PRIZE 0{p.rank}</span>
                    <Icon name="ticket" size={30} />
                    <h3>{p.title}</h3>
                    <code>{w?.ticket || "Not allocated"}</code>
                    <small>
                      {w
                        ? "Selected demo ticket / no real prize"
                        : "Fewer eligible entries than available prizes"}
                    </small>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="waiting-result">
              <span className="quarter-state">
                {c.status === "locked"
                  ? "Snapshot locked"
                  : "Awaiting entry close"}
              </span>
              <strong>{format(c.drawAt)} ICT</strong>
              <span>No winner has been selected.</span>
            </div>
          )}
          <details className="draw-record">
            <summary>
              Inspect the draw record
              <Icon name="shield" size={18} />
            </summary>
            <div>
              <p>
                <strong>Method:</strong> HMAC-SHA256 rank of unique tickets,
                without replacement. Each account can receive at most one prize.
              </p>
              <label>
                Seed commitment<code>{c.seedCommitment}</code>
              </label>
              <label>
                Frozen entry-list hash
                <code>
                  {c.snapshotHash || "Published after the snapshot is locked"}
                </code>
              </label>
              <label>
                Revealed seed
                <code>{c.seedReveal || "Published after the draw"}</code>
              </label>
              {!!c.snapshot.length && (
                <details>
                  <summary>
                    Public snapshot ({c.snapshot.length} tickets)
                  </summary>
                  <pre>{c.snapshot.join("\n")}</pre>
                </details>
              )}
              {c.seedReveal && (
                <Button variant="secondary" onClick={() => void checkProof()}>
                  Verify record consistency
                  <Icon name="check" size={17} />
                </Button>
              )}
              {verify && <p role="status">{verify}</p>}
              <p className="small muted">
                This verifies the record's internal consistency, not
                independence from the operator. A live campaign needs an
                approved process, external oversight and durable audit storage.
                Browser-demo data is editable by its owner.
              </p>
              <h3>Campaign activity</h3>
              {c.audit
                .filter((a) => !a.event.includes("entry-recorded"))
                .map((a, i) => (
                  <p className="audit-line" key={i}>
                    {a.event}
                    <span>{format(a.at)} ICT</span>
                  </p>
                ))}
            </div>
          </details>
        </section>
      )}
      {tab === "rules" && (
        <section className="giveaway-rules">
          <span className="eyebrow">PROTOTYPE RULES / {c.termsVersion}</span>
          <h2>Clear rules. No hidden mechanics.</h2>
          <p>
            <strong>Nature of this build.</strong> This is a free,
            non-commercial demonstration. It does not take payment, sell
            tickets, promise a real trip or collect passport details.
          </p>
          <p>
            <strong>Eligibility proposal.</strong> One active, email-verified
            member account per person; adults aged 18 or over. Promoter/admin
            accounts do not participate. Age confirmation is self-declared in
            this prototype and is not identity verification.
          </p>
          <p>
            <strong>Entry window.</strong> {format(c.opensAt)} to{" "}
            {format(c.closesAt)} ICT (closing instant excluded). Your entry is
            recorded only after you explicitly accept the rules. Every entry has
            equal weight; activity, likes and posting frequency add no entries.
          </p>
          <p>
            <strong>Selection.</strong> The entry list is locked before the
            draw. Ticket codes are ranked using the committed random seed and
            the frozen list. Highest-ranked available tickets receive first,
            second and third prize, one prize per ticket. A repeated draw
            request returns the same saved result.
          </p>
          <p>
            <strong>Odds.</strong> With N eligible unique entries and up to
            three prizes, a ticket's chance of receiving any prize under the
            specified random mechanism is min(3,N)/N. The final N is known only
            after the list is frozen. This is a mathematical description, not a
            certified fairness claim.
          </p>
          <p>
            <strong>Rewards and claims.</strong> All three rewards are
            illustrative. A live campaign must define the organizer, budget,
            prize value, itinerary, visa/insurance/tax allocation, delivery
            dates, claim deadline, disputes, and any alternate-winner procedure
            before accepting entries. There is no live prize-claim or
            fulfillment feature here.
          </p>
          <p>
            <strong>Privacy.</strong> Only ticket codes are published. Do not
            enter sensitive information. The browser preview remains local; the
            Flask extension mode stores data in the configured database.
          </p>
          <p>
            <strong>Before going live.</strong> A responsible organizer must
            review applicable promotion, privacy and tax requirements. Free
            entry is not, on its own, a determination that no regulatory process
            applies. Real campaigns remain disabled in this build.
          </p>
        </section>
      )}
      {user?.role === "admin" && (
        <section className="draw-admin">
          <div>
            <span className="eyebrow">ADMIN / DEMONSTRATION CONTROLS</span>
            <h3>Test the quarterly flow, without awarding a real prize.</h3>
            <p>
              Only the demo may be closed early. The draw cannot be rerolled,
              and winners cannot be chosen by an administrator.
            </p>
          </div>
          <div>
            <Button
              variant="secondary"
              disabled={busy || c.status !== "open" || !c.entryCount}
              onClick={() => setConfirmFreeze(true)}
            >
              Lock demo entries
            </Button>
            <Button
              disabled={busy || c.status !== "locked"}
              onClick={() => setConfirmDraw(true)}
            >
              Record demo draw
              <Icon name="arrow" size={16} />
            </Button>
          </div>
        </section>
      )}
      <p className="giveaway-runtime">
        {serverMode
          ? "Connected Flask extension / server-side entry and draw storage"
          : "Browser-only simulation / not a secure or legally approved promotion"}
      </p>
      <Modal
        open={join}
        onClose={() => setJoin(false)}
        title="One entry. Your choice."
      >
        <p className="muted">
          You are entering {c.title}. The travel and cinema rewards are
          illustrative only.
        </p>
        <div className="join-rules">
          <label className="check-row">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            I have read and accept the demo rules. I understand no real prize is
            awarded.
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={age}
              onChange={(e) => setAge(e.target.checked)}
            />
            I confirm I am at least 18 and am not entering with multiple
            accounts.
          </label>
        </div>
        <small>
          In the browser preview, eligibility checks are simulated. A live
          service must verify eligibility on the server.
        </small>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setJoin(false)}>
            Not now
          </Button>
          <Button
            busy={busy}
            disabled={!agree || !age}
            onClick={async () => {
              if (
                await run(
                  () => gateway.enter(user, c.id, agree && age),
                  "Your free demo entry is recorded.",
                )
              )
                setJoin(false);
            }}
          >
            Record my entry
            <Icon name="ticket" size={16} />
          </Button>
        </div>
      </Modal>
      <Modal
        open={confirmFreeze}
        onClose={() => setConfirmFreeze(false)}
        title="Lock this demo's entry list?"
      >
        <p>
          New entries will stop. This action cannot be undone in the UI.
          Existing tickets will become the public, fixed snapshot.
        </p>
        <Button
          busy={busy}
          onClick={async () => {
            if (
              await run(
                () => gateway.freeze(user, c.id),
                "Demo entry list locked.",
              )
            ) {
              setConfirmFreeze(false);
              setTab("results");
            }
          }}
        >
          Confirm snapshot lock
        </Button>
      </Modal>
      <Modal
        open={confirmDraw}
        onClose={() => setConfirmDraw(false)}
        title="Record the demo draw once?"
      >
        <p>
          The server in connected mode selects and saves the result. This does
          not award real travel or cinema prizes. No reroll is available.
        </p>
        <Button
          busy={busy}
          onClick={async () => {
            if (
              await run(() => gateway.draw(user, c.id), "Demo result recorded.")
            ) {
              setConfirmDraw(false);
              setTab("results");
            }
          }}
        >
          Confirm demo draw
        </Button>
      </Modal>
    </>
  );
}
