# Fan Hub Plus V3 frontend

Start the bundled browser preview with `node tools/serve.mjs`, then open `http://127.0.0.1:4173`.

For the complete setup, Flask integration, AI configuration and honest implementation status, read `../README.md` and `../docs/`.

The main additions are in `src/features/`: Community, Lore Master, Quarterly Gifts, typed gateway, HTTP client and an explicitly labeled browser simulator. The source builds a portable preview in `dist`. A full npm/Vite source build is a separate workflow that was not executed in the delivery environment.

`docs/upstream-v1` contains archival V1 notes only. Its APIs/test totals are not V3 completion evidence. Current logs/screenshots are in `evidence`; current tests are `tests/*.test.mjs` and `tests/features_ui.py`.
