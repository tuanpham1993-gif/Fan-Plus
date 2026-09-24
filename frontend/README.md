# Fan Hub Plus frontend V2

A custom editorial redesign of the existing React/TypeScript prototype. This is still a **frontend simulator**, not integrated server authentication.

## Preview

```bash
node tools/serve.mjs
```

Open `http://127.0.0.1:4173`. Requires Node 22.12+. No npm installation is needed for the included `dist/`. `START_DEMO.cmd` and `START_DEMO.sh` run the same local server. Do not publicly host the mock account system.

Demo member: `fan@fanhub.demo`; demo administrator: `admin@fanhub.demo`. Both use `FanHubDemo!26`. Use fictional credentials only.

## V2 changes

Home and shared navigation are rewritten around an editorial grid: off-white canvas, dark green ink, serif headings, restrained controls, numbered category directory, cover story, selected reading and event agenda. Search, bookmark, menu and navigation use monochrome SVGs. Emoji characters and the decorative sparkle glyph are absent from first-party UI source. The floating chat button is removed; the optional local assistant is reachable through a labelled footer link.

Shared styles cover Explore, Detail, account pages, events and the administrator interface. Responsive rules, reading size, light/dark preferences, keyboard search, breadcrumbs, loading/error states and the sitemap are retained. The source includes no supplied font files.

## Data boundaries

`src/services/repository.ts` remains the active local repository. `src/services/http.ts` is a **new Flask contract client**, not an activated API mode. It uses same-origin cookies, fetches CSRF from `/api/v1/auth/csrf`, adds `X-CSRFToken`, understands error envelopes and invalidates CSRF after login/logout. Resource-specific DTO adapters and asynchronous per-screen data loading remain to be connected.

The prototype stores fictional content and interactions in localStorage and simulated session data in sessionStorage. This is unsuitable for real authentication or access control. The backend design replaces it; do not silently mix backend mutations with local state.

The included images and text describe invented fandoms. Catalog rating/popularity fixtures are illustrative, not measured popularity. Events are invented, not ticket listings. The map is an external dependency loaded only with consent. The assistant does not invoke an LLM.

## Source development

```bash
npm install
npm run dev
npm run build
```

The normal build runs TypeScript checking and emits `dist-vite/`. Vite proxies `/api` to `http://127.0.0.1:5000` during development. Set backend `FRONTEND_DIST` to the absolute `dist-vite/` directory when deploying that build. The included portable preview uses `dist/` instead and does not proxy API requests.

Registry access was unavailable during authoring. `npm install` and the normal Vite build were **not** completed. The included portable compiler used an existing TypeScript installation. Transpilation is not full React semantic checking.

```bash
npm test
FANHUB_HARNESS=1 python tests/ui_test.py
```

The second command requires Python Playwright and Chromium. For normal browser navigation start the preview server and omit `FANHUB_HARNESS`. Evidence here was collected using the explicit memory-navigation harness, not a live Flask integration.

For the complete architecture and remaining work, read `../docs/`.
