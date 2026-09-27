> ARCHIVE: original V1 notes, not the current V3 implementation status. See ../../../docs/IMPLEMENTATION.md.

# Executed tests and limits

## Recorded results

Creation environment: Node 22.16.0, TypeScript available from a preinstalled local package, Python Playwright and Chromium. Actual browser version is recorded in evidence/ui-tests.json.

- Portable build: 21 TypeScript/TSX modules transpiled successfully into dist.
- Strict semantic TypeScript check: domain/types, domain/seed, domain/logic, services/repository and services/http passed. React component type-checking was NOT included in this check.
- Node tests: 47/47 passed (18 domain, 17 local repository, 12 actual HTTP preview checks). See evidence/unit-tests.txt.
- Browser UI: 19/19 groups passed. Included 15 routes at widths 1440, 768, 390 and 320 (60 route/width combinations), plus six 320px routes with 125% font size/light theme. See evidence/ui-tests.json and ui-run.log.
- No uncaught runtime errors in those UI tests. One console warning is retained: about:blank cross-origin restrictions prevented loading the video's VTT track in that harness. The actual HTTP server test verifies the VTT file, MIME and content, but visual caption rendering remains unverified.

The npm registry was unavailable, so npm install, npm audit and the full npm/Vite build were NOT run. No package-lock.json is fabricated. Versions in package.json are explicit development pins, not a claim of current security approval. The included portable dist is the actual tested preview.

## Re-run Node tests

After changing source, rebuild the portable output, because these tests import dist modules:

```bash
npm install
npm run build:portable
npm test
```

The HTTP test starts its own actual loopback server on 4187 by default and tears it down afterwards. Override FANHUB_HTTP_TEST_PORT if needed. The manual preview normally uses 4173 and can run independently. Test data is isolated from any real browser account.

Domain coverage includes combined filters, publication-state filtering, paging, accent-insensitive search, recommendation reasons, distance calculations, external URL validation, safe return paths, input validation and ICS escaping/folding. Repository coverage includes registration/reset, suspended users, per-user bookmark ownership, note/rating guards, pending submissions/moderation, category integrity and unavailable/corrupt storage. These are representative tests, not exhaustive code coverage.

## Re-run normal browser tests on your own machine

Install Python Playwright in a suitable virtual environment and install a Chromium browser:

```bash
python -m pip install playwright
python -m playwright install chromium
node tools/serve.mjs
```

In a second terminal:

```bash
python tests/ui_test.py
```

The test defaults to /usr/bin/chromium. Set CHROMIUM_PATH to your actual browser executable (especially on Windows/macOS), and FANHUB_TEST_URL if the preview URL differs. The tests contain a scripted simulated geolocation success/denial even in normal mode, so also perform a separate real GPS test. Each run starts with a fresh browser context and does not log into a real service.

## Restricted-environment mode used for the recorded UI evidence

The creation environment's managed Chromium blocks top-level URL navigation. Its policies were not changed. The included browser_harness mounts the shipped ES modules and CSS in about:blank and injects in-memory navigation and Web Storage ports. The DOM, React, dialogs, rendering, native audio/video decoding and event handlers are real. Page-level CSS and interactions can therefore be tested without pretending that native HTTP navigation was exercised.

```bash
FANHUB_HARNESS=1 python tests/ui_test.py
```

This syntax is for a POSIX shell. In PowerShell set `$env:FANHUB_HARNESS="1"` first, then run the Python command. The normal application still defaults to browser History and real localStorage/sessionStorage; the injected ports are a test facility.

## Still required before production/submission

Full React semantic build and upstream dependency audit; native HTTP browser flows and actual reload/back/forward persistence; actual email verification/reset; API authentication/CSRF/object ownership; concurrent users and race conditions; real GPS/HTTPS and online map behavior; image upload validation; active-user/chat analytics definitions; real LLM retrieval/citation evaluation if enabled; accessibility/screen-reader/contrast/200% browser zoom; Chromium/Firefox/WebKit coverage; media captions; native calendar import; deployment/load/availability tests; a fresh-machine full-system install and complete SRS demonstration.

Do not describe the recorded tests as full backend end-to-end tests, WCAG certification, security certification or a production-readiness guarantee.
