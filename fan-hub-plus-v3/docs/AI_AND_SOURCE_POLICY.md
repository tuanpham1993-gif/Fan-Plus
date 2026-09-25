# Lore Master: what is implemented and what remains

## Three honest answer states

1. **Browser sample / library excerpt**: deterministic retrieval of a note from bundled data. No model is called.
2. **Flask extractive library**: the server retrieves approved notes and returns their text. Shared storage and access controls are real application code; text generation is still not enabled.
3. **AI configured**: Flask retrieves relevant notes, constructs an explicitly bounded source packet, calls the configured OpenAI Responses API model and validates structured output. A missing source produces an abstention before any provider call. An unavailable provider gives an error, never a fake answer substituted from a demo.

A configured key is not a test result. No live provider call was made during this delivery; provider tests use injected HTTP responses.

## Retrieval and generation

`question -> validate -> published/spoiler/topic filters -> alias/title lexical retrieval -> source packet -> optional model -> source-ID validation -> answer and local source links -> owner-scoped history`.

This is a source-grounded generation design with a lexical retriever. It is **not** an implemented vector database, embedding model, semantic reranker, web-search agent or LlamaIndex/Qdrant deployment. The small note library does not need those systems to demonstrate the boundary between retrieval and generation.

Source packets contain at most three short notes and at most 6,000 characters per note. The structured response contains `answer` and `source_ids`. Citation IDs must belong to the retrieved allowlist and be nonempty for generated answers. This validates provenance IDs, not whether every sentence is actually entailed by the source. Human factual review remains necessary.

Only approved editorial notes are ingested through an operator CLI. Community posts are never silently promoted into factual lore. No arbitrary user-provided URL fetch, executable tool, SQL command or HTML output is available to the model. Prompts distinguish system instructions from untrusted excerpts and prior user questions. These are defense-in-depth measures, **not a guarantee against prompt injection or hallucination**.

## Data that the team must supply

For each real work, curate a licensed/authorized synopsis or original editorial summary, the exact work/adaptation/year, useful aliases, source/provenance and spoiler flags. For the Limitless example, verify against the chosen original manga/anime or an appropriately attributed licensed reference before marking it non-sample. The bundled note is clearly unverified; it is not evidence that every listed canonical detail has been checked.

Do not scrape entire copyrighted scripts, wiki collections, lyrics or fanfiction and assume they are free to republish. The prompt asks for concise explanations and no extensive lyric/script reproduction. Source rights remain an ingestion responsibility, not a problem solved by an AI API.

The current `spoilerLevel` is a coarse editorial flag. Safe mode admits only zero-spoiler notes. It does not model a user's episode-by-episode progress. Some prior safe-mode answers are also hidden in the UI when their saved citation metadata contains a spoiler. Directly opening a source page is a deliberate reading action, not an access-control boundary.

## Suggested quality evaluation (not executed or claimed)

Prepare a manually reviewed evaluation set containing known lore questions, film summaries with sufficient sources, ambiguous titles, missing-source questions, adaptation conflicts, spoiler traps and prompt-injection attempts. Check answer support, source identity, truthful abstention and leakage. Test Vietnamese and English separately. Record human judgments and failures; do not turn mock unit-test passes into a claim of model accuracy.

Future upgrades can add structured adaptation/episode metadata, BM25 or embeddings, reranking, a vetted public-source ingestion queue, streaming and grounded follow-up evaluation. They are optional next steps, not hidden dependencies in this build.

## Primary references checked during development

OpenAI structured outputs: https://developers.openai.com/api/docs/guides/structured-outputs

OWASP prompt-injection prevention: https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html

Flask application factories: https://flask.palletsprojects.com/en/stable/patterns/appfactories/

These engineering notes are not the team's competition report. Review current API/model availability when configuring your own account.
