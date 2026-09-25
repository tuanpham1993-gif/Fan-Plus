> ARCHIVE: original V1 notes, not the current V3 implementation status. See ../../../docs/IMPLEMENTATION.md.

# Working review notes for the group

These are source-grounded engineering notes, not a completed competition report. Original inputs remain unchanged.

## SRS vs Gemini

The SRS allows several backend choices and specifically lists Flask/Django for Python (page 13). FastAPI is not listed. This does not establish an absolute prohibition; obtain organizer confirmation before committing. React, metadata-filtered retrieval, separate services and reproducible installation are sensible ideas, but adding FastAPI + SQL Server + Qdrant + LlamaIndex + Docker at once is a substantial integration load for the supplied seven-day plan. Choose fewer moving parts until all mandatory flows work.

The Gemini example exposes /api/admin/ingest without an authentication/administrator dependency. Importing Depends without using it does not protect the route. Its async route directly calls a synchronous query utility; that does not automatically move blocking work to a threadpool. Use appropriate async clients or explicitly isolated blocking work.

The text calls the approach semantic chunking, but the shown SentenceSplitter is sentence/token-aware splitting, not an embedding-based semantic splitter. Metadata enrichment is useful; naming it accurately matters. A category filter alone is also not a fandom/canon/entity filter.

Returning str(response) loses structured source references. A robust response should include answer, source ids/links and unsupported/no-evidence state. Model and embedding configuration should be explicit and verified against current provider availability; do not treat an old hardcoded example as a production choice.

A concrete test bug: MagicMock(response="answer text") does not make str(mock) return that response field. The shown service returns str(response), while the test asserts the text stored in .response. Set __str__.return_value deliberately or return/test a structured DTO. Also, assert mock.insert.called only checks at least one call, not exactly once. Mock orchestration tests do not establish correct retrieval or a production-ready application.

The schema/API sketches leave important work unspecified: reset/verification/session lifecycle, rating uniqueness, bookmark-note update, fan moderation audit, source provenance, event timezone and usage-statistic definitions. These are design gaps to close, not evidence that the proposed direction is worthless.

## Tasksheet findings

The workbook could not be read through indexed file retrieval; it was inspected directly with openpyxl. Sheet names below are shortened to their numeric prefixes where helpful. No content citation is invented for the failed indexed read.

- `01_Tong quan` corresponds to the original sheet numbered 01: B7 gives 24-30 September 2026; B16 sets end-to-end integration on 28 September, test/fix on 29, deliverables on 30.
- `04_Timeline!A3:A9` instead contains 24,24,25,25,26,26,27 September. It also mixes text and date cells. Align all seven milestones with one approved schedule.
- `09_Deliverables!E2:E13` gives 28 September throughout, while the overview and backlog reserve delivery work for 30 September. Decide whether 28 is an internal draft deadline; label it explicitly if so.
- `02_SRS_Requirements!D12` marks fan submission OPTIONAL, while the SRS lists submission with administrator approval without marking it optional. Media/rating, characters/articles, showcase, feedback, events/GPS and accessibility are also placed below MUST in that sheet. These may be sequencing labels, but must not silently become omitted acceptance criteria.
- The SRS explicitly makes the AI assistant optional. Deferring AI until core completion is correct.
- `03_Phan_cong_6_nguoi` gives Khoi account/dashboard/bookmark/feedback/events/map/submission/chat responsibilities. Rebalance before parallel implementation; see ARCHITECTURE.md.
- The backlog has 44 tasks. Expand explicit acceptance tests for reset/verification, ratings, moderation, location denial, text scaling and ownership checks instead of treating a button's existence as completion.
- `06_API_DB` should be extended for auth/logout/reset/verification, own note updates, rating updates, moderation decisions and nearby-event query validation. The existing tasksheet is not proof that a particular FastAPI/SQL Server backend has already been approved or implemented.

## Suggested milestones, not an edit to the workbook

24 September: confirm stack/permission assumptions and DTO contract, review frontend modules.
25 September: auth/content/category APIs and first real explorer/detail integration.
26 September: profile/bookmark/rating and admin content integration.
27 September: submission/moderation, media, events/calendar/location and feedback integration.
28 September: full required-flow freeze and fresh-install rehearsal.
29 September: authorization, browser, accessibility, error-path regression; no large new feature.
30 September: team-authored report/diagrams, schema/test data, actual credentials, mandatory MP4 and final package.

Schedule feasibility depends on team proficiency and existing backend progress, which the uploaded material does not establish. If capacity is tight, reduce optional AI/gamification rather than silently remove SRS baseline requirements.
