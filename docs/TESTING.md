# Delivery verification

## Executed results

- **70 Node tests passed**, zero failures: retained catalog/domain/repository/HTTP-preview tests plus 23 V3 feature tests. Actual Node WebCrypto SHA-256 and HMAC are checked against an independent Node implementation. Emoji-pictograph scan covers application TS/TSX/CSS and original SVG illustrations.
- **50 Python tests passed**, one **HTTP-test module skipped**. Tests cover SQLAlchemy/SQLite foreign-key-backed services, permissions, validation, moderation versions, unique reactions, comments, reports, entry policy, seed/snapshot integrity, one-time results, source filters, history isolation, password/session helpers, rate limits and mocked provider contracts.
- **13 Chromium UI test groups passed**, zero uncaught page errors. The tests exercise original navigation, the member/admin publishing loop, reactions, comments/replies, text-only rendering of script-like input, Lore history/source/abstention, dialogs, entry/lock/draw and proof verification.
- **13 UI test groups passed**, including Community composer/category/media checks, admin moderation entry points, accessibility-oriented interactions and responsive viewport checks. The portable TypeScript build transpiled 28 modules successfully; the Node feature suite passed **71 tests**.
- Portable frontend compilation succeeded. Strict semantic TypeScript checks succeeded for the V3 types, seed, browser simulator, HTTP client and gateway. Python files passed syntax compilation.
- SQLAlchemy generated MySQL baseline DDL for **14 tables**. A separate local SQLite setup command was smoke-tested with seeded accounts/posts/knowledge and the current-quarter demo campaign.

## Exact boundaries

The environment blocks top-level Chromium navigation by managed policy. The UI tests therefore use the **documented harness**: actual React modules, native dialogs, rendered CSS and real event handlers are mounted in about:blank; navigation and Web Storage use injected in-memory ports. Secure-context WebCrypto is unavailable there, so only the harness delegates digest/HMAC to Python hashlib/hmac. No browser policy was changed. The implementation uses ordinary browser WebCrypto on localhost/HTTPS; the algorithms were additionally exercised natively in Node.

The screenshots show actual components running in this harness, not image-generation mockups. They are not proof of cross-device native storage persistence, GPS, actual HTTP authorization or production browser compatibility.

**Flask, Werkzeug and related runtime packages were unavailable, and dependency installation could not reach the package registry.** The HTTP module has explicit skip behavior and was not counted as passing. Flask route source compiled, but the actual Flask app, cookies/CSRF over HTTP and the live frontend-to-Flask network flow were not executed here. Do not describe this delivery as a passed end-to-end backend deployment.

No live OpenAI request was made, and no AI accuracy benchmark was run. Provider tests inject HTTP responses and validate payload shape, source IDs and failure behavior. Model quality, latency, refusal behavior, billing and actual account/model compatibility remain unverified.

No MySQL server was started. No production migration, real concurrent load test, external prize audit, email service, live promotion, prize claim, sponsor or travel fulfillment was verified. `npm install`, the full React type-check and the normal Vite production build were not completed in this environment. The included portable build is a separate compilation path.

## Re-run commands

From `frontend`:

```sh
node --test tests/*.test.mjs
node tools/serve.mjs
# In a separate terminal, native browser tests on a normal machine:
python tests/features_ui.py
# Only in the documented restricted environment:
FANHUB_HARNESS=1 python tests/features_ui.py
```

`features_ui.py` uses `/usr/bin/chromium` in the delivery environment. Change its executable path or use Playwright's installed Chromium on another OS. Install Python Playwright before running UI tests. This is a test dependency, not an app runtime requirement.

From `backend`, after installing `requirements-dev.txt`:

```sh
python -m pytest -q
python manage.py schema-mysql
```

Full frontend source checks on a network-enabled machine:

```sh
npm install
npm run build
```

## Evidence

`frontend/evidence/all-node-tests.txt`, `features-node-tests.txt`, `types-features.txt`, `v3-ui-results.json` and `v3-ui-log.txt`.

`backend/evidence/pytest.txt`, `draw-fixture.json` and the actual test source files.

Older V1 descriptions are archived under `frontend/docs/upstream-v1`; their test counts are not evidence for this upgrade. A screenshot demonstrates one rendered state, not the correctness of every workflow.
