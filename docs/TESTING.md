# Testing record - V2

## Completed in the authoring environment

| Layer | Result | Evidence |
|---|---|---|
| Frontend Node suites | 49 passed, 0 failed | frontend/evidence/unit-tests.txt |
| First-party emoji/decorative-control checks | Included in the 49 tests | frontend/tests/design-contract.test.mjs |
| Chromium UI integration harness | 19 groups passed | frontend/evidence/ui-tests.json |
| Responsive coverage | 60 route/viewport combinations plus 6 enlarged-text checks | frontend/evidence/ui-run.log |
| Portable TS build | 21 modules transpiled | frontend/evidence/build.txt |
| Strict TypeScript check of domain/services, including new HTTP client | Passed, no diagnostics | frontend/evidence/typescript-core.txt |
| Backend Python models/schemas/services/migrations/contract | 61 passed; 1 HTTP module skipped | backend/evidence/pytest.txt and pytest.xml |
| SQLite migration | Upgrade and downgrade tested | tests/test_migrations_contract.py |
| MySQL schema/migration | Offline DDL compilation only; circular FK ALTERs checked | backend/evidence/mysql-migration-offline.sql |
| Python source | compileall completed without syntax errors | All app and migration modules |

The one skipped backend module contains six Flask test-client cases. It is skipped at import because the required Flask packages were unavailable. Those cases are not counted as passed.

## What these results do not prove

The UI harness runs real React DOM/CSS in Chromium but uses in-memory navigation/storage and simulated geolocation. Native browser navigation to localhost was restricted in this environment. Node static-server HTTP tests are separate from this harness; **neither is a live Flask end-to-end test**.

Full-page screenshots were recaptured with off-screen lazy images eagerly decoded, solely so the preview shows the complete layout. The application still uses normal lazy loading. Screenshots are rendered interfaces, not hand-drawn mockups.

Flask, Flask-WTF and Flask-Limiter could not be installed because package-registry access failed. The Flask route layer was authored and syntax-checked, but not started. Real MySQL, Redis, SMTP, Docker and cross-browser testing were not completed. MySQL DDL compilation is not a real migration or transaction-isolation test.

npm registry access also failed. The normal npm/Vite build and full React semantic type-check did not run. The portable compiler and separate strict domain/service checks are explicitly narrower checks. Version ranges in backend/requirements.txt and the frontend package list are not a newly resolved reproducible dependency lock.

UI source-level emoji checks do not measure AI detection, authorship, or model involvement. Layout tests do not constitute formal WCAG conformance or a security audit. Artificial catalog ratings and fictional events are not real analytics/listings.

## Required next acceptance run

Install dependencies, run the Flask-client suite with no skipped runtime module, migrate a disposable MySQL database, verify referential checks/concurrent reviews and run browser-to-API flows with two isolated users. Verify token replay/expiry/logout, email failure/retry, route ownership, media upload handling, real GPS/map behavior, keyboard/screen-reader use and complete SRS coverage. Resolve production dependency versions and scan them before deployment.
