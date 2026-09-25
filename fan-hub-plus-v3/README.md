# Fan Hub Plus V3
## Lore Master / Community / Quarterly Gifts / Flask extension backend

This upgrade is based on the user's **Fan_Hub_Plus_Frontend_v1(1).zip**, not an assumed merge of the earlier V2 backend. The original catalog, media, events and account screens are retained. The new modules share an updated editorial design without emoji pictographs.

**Read this distinction first:** the ready-to-run Node preview is a browser simulation. The included Flask implementation is connected by a separate HTTP gateway for authentication, Community, Lore and Giveaways. The original V1 catalog CRUD/bookmark/profile tools still use browser data even when Flask serves the application. This is not a claim that the entire SRS is now a production end-to-end service.

## 1. Run the frontend immediately

Install Node.js 22.12 or newer, then:

```sh
cd frontend
node tools/serve.mjs
```

Open `http://127.0.0.1:4173`. Windows users can also double-click `frontend/START_DEMO.cmd`. Do not open `dist/index.html` as a `file://` URL. No npm installation is required for the bundled preview.

Member: `fan@fanhub.demo` / `FanHubDemo!26`.
Administrator: `admin@fanhub.demo` / `FanHubDemo!26`.
Use fictional data only. Browser demo identity and permissions are not security controls.

Visit `/community`, `/assistant` and `/giveaways`. The **Ask Lore** header action opens a right-hand reading drawer on desktop and a full-height dialog on mobile. No floating robot or emoji button covers the page.

## 2. Run the Flask extensions locally

Python 3.11 or newer is the suggested development environment. Commands below use Windows CMD; on macOS/Linux use `source .venv/bin/activate` and `cp` instead of `copy`.

```bat
cd backend
python -m venv .venv
.venv\Scripts\activate
python -m pip install -r requirements-dev.txt
copy .env.example .env
python -c "import secrets; print(secrets.token_hex(32))"
```

Put the generated random string into `SECRET_KEY` in `.env`. Leave `LORE_MODE=extractive` for an offline source-library demonstration. The default SQLite database is local development only. The MySQL target is supported by the SQLAlchemy models and a generated baseline in `backend/schema/mysql.sql`, but MySQL execution was not tested in the delivery environment.

```bat
python manage.py init-demo
python -m flask --app wsgi:app run --host 127.0.0.1 --port 5000
```

Open **`http://127.0.0.1:5000`**, not port 4173, for connected extension mode. Flask serves the built frontend and overrides `/runtime.js` to select the HTTP gateway. The top strip identifies connected mode. API failures are displayed; they do not silently fall back to local mock data.

`init-demo` creates sample credentials and illustrative prizes. Never run it on a public production database. `DEMO_VERIFY_REGISTRATION=1` is a supervised local-demo convenience, not real email verification. Set it to `0` outside that setting. `python manage.py verify-user user@example.com` records administrator verification; it does not send an email. Reset email delivery and real identity verification remain unfinished.

For a new MySQL development database, create it first using `utf8mb4`, change `DATABASE_URL`, and run the setup command against that new database. Do not apply the baseline SQL over an existing V2 schema: there is **no automatic V2-to-V3 migration**. Review table mappings before merging.

## 3. Enable a real AI model

Only the Flask server reads provider credentials. In `backend/.env`:

```dotenv
LORE_MODE=openai
OPENAI_API_KEY=YOUR_SERVER_SIDE_KEY
OPENAI_MODEL=YOUR_AVAILABLE_RESPONSES_API_MODEL
```

Choose a model available to your account that supports the Responses API and structured JSON output. Restart Flask. The UI changes to **AI configured**, not a fabricated connectivity certification. The model is called only when a matching approved note is available. No credentials are included in frontend source or runtime.js.

This build includes a five-note demonstration library, not a movie database. The Gojo note is explicitly **an illustrative editorial sample, not canon-verified**. The Neon Horizon note describes original fictional V1 content, not a released film. A model key alone does not provide verified summaries for every film.

Add your own licensed/authorized editorial source notes using the JSON shape in `backend/seed/demo.json` (the `knowledge` list). Save a standalone list to a file, then:

```sh
python manage.py ingest your-reviewed-notes.json
```

Record title, adaptation/year/episode in the note and aliases, accurate provenance, spoiler level, publication state and `sample` status. The current source schema has a `topic` field but **no dedicated episode-progress model**. Safe mode filters out all nonzero spoiler levels before retrieval. Free-form per-episode progression is a future extension, not implemented.

See `docs/AI_AND_SOURCE_POLICY.md` for limitations, source checks and provider behavior.

## 4. Demonstrate the social flow

Sign in as a member, open Community and choose **Write a post**. Choose one of the nine categories — **Soundtrack, Anime, Gaming, Movies, TV Shows, K-pop, Comic, Manga, Cosplay** — and a content type: **Post**, **Video** or **Soundtrack**. Add a title, work/topic and body; Video/Soundtrack also require a direct HTTPS media URL or a local `/media/...` path. Preview it, confirm authorship and send for review. Member submissions appear under **My posts** and are not public until an administrator approves them.

Sign in as the admin and open Community > **Review queue** (or use the Community moderation shortcut in the Admin workspace) to publish or request changes on member submissions. Administrators may also create or edit their own Community content; those admin-authored posts publish immediately instead of entering their own review queue. Published content accepts likes or love (one reaction per user), comments and one-level replies. Member edits return to moderation. Reports appear in the admin **Reports** tab.

Media support is deliberately URL-based in this revision: it renders direct video/audio sources, but it does not yet implement arbitrary binary uploads, transcoding or media storage. There are also no private messages, follow graph, live notifications or infinite real-time feed. Those require separate moderation, storage and privacy work.

## 5. Demonstrate the quarterly draw

Open Quarterly Gifts, read the demo rules, and record one free member entry. The admin cannot enter. Likes, comments, posting frequency and purchases never grant extra entries. This is a calendar-quarter cycle in `Asia/Ho_Chi_Minh`, not a fixed 90-day interval.

The admin may lock a **demo** snapshot early, then record the draw once. The results page shows ticket codes, commitments, the frozen snapshot, revealed seed and a consistency-verification button. No real travel or cinema prize is awarded. No reroll or manual winner-selection endpoint is provided.

To open a later quarter on the backend, run `python manage.py open-quarter`. It is idempotent and never resets an existing campaign. Scheduling this command every quarter is an operator task; no background scheduler is installed or running in this kit. Actual drawing remains an explicit administrator operation.

See `docs/GIVEAWAY_INTEGRITY.md`: internal reproducibility is not independent fairness, legal approval, sponsor funding or prize fulfillment.

## 6. Engineering checks

Frontend logic/tests: `cd frontend && node --test tests/*.test.mjs`.
Backend pure services/provider contract tests: `cd backend && python -m pytest -q`.
Full frontend source build on a network-enabled machine: `npm install` then `npm run build`.

The delivery environment compiled the portable preview, passed 70 Node tests, 46 Python tests and 13 Chromium UI groups. One Flask HTTP-test module was skipped because the Flask runtime could not be installed. UI screenshots were captured in the documented managed-browser harness with injected navigation/storage and a test-only cryptography adapter; native WebCrypto algorithms were separately tested in Node. See `docs/TESTING.md` for the exact boundaries and actual logs.

## Package guide

- `frontend/`: retained V1 source, V3 UI/modules, portable `dist`, original assets, current tests/screenshots.
- `backend/fanhub/`: Flask factory, relational models, social/draw services, source retrieval and optional provider.
- `backend/schema/mysql.sql`: generated extension baseline, not a tested migration.
- `backend/tests/`: service, validation, provider-contract and HTTP tests.
- `docs/`: engineering/integration notes, not a ready-made competition report.

Before submission, the team must review and meaningfully modify the work, understand it, and acknowledge assistance according to the SRS. The notes in this kit do not substitute for the team's own required report or demonstration video.
