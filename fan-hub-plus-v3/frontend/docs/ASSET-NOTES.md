# Assets and third-party runtime

## Original demonstration material

The SVG artwork in public/art was authored programmatically for this prototype. public/media/portal.webm is a six-second original animation made from the project's own visual composition. orbit.wav is an eight-second generated demonstration tone sequence, not a commercial song or soundtrack. portal.vtt is the associated short demonstration caption file. The asset-generation helper is tools/create-assets.py; it optionally requires Python, cairosvg and ffmpeg and is not needed to run the included preview.

The eight fictional fandom labels, short article bodies, character sketches, future releases and event fixtures are test content, not descriptions of licensed existing franchises. Familiar real-world category names (Anime, Gaming, etc.) classify the UI. Demo event names, schedules and venue descriptions are not actual invitations or travel recommendations. Catalog popularity/ratings are illustrative fixture values, not claims about real users. Administrator counts are computed from local demo records.

No commercial fandom images, logos, lyrics, borrowed trailers, uploaded source-document images or font files are included. The application uses system fonts. Additional real media must be licensed/authorized and attributed before integration.

## Included portable React runtime

public/vendor/react-runtime.js includes React 19.1.1, React DOM client and Scheduler library code under the React MIT license, with LICENSE-React.txt retained. In the offline creation environment these library sections were recovered from the preinstalled Playwright trace-viewer distribution, then isolated into a small ES module export surface. No Playwright application UI or project template is included. This is an unusual offline packaging path, not the recommended npm development workflow and not a claim of a signed, separately audited upstream binary.

The normal source package imports React and react-dom/client from the explicit dependencies in package.json and does not import the vendor file. The vendor file is used only by the dist import map for a no-install local preview. For a final deployment, install reviewed upstream packages, generate a lockfile, run the full Vite build, dependency audit and browser tests, and deploy that reviewed output. The MIT notice must remain with redistributed React library code.

Online event maps use an OpenStreetMap embed only after the user clicks to load it. This may contact external providers and requires internet. The map's attribution remains in the embed; this package does not bulk-download or cache map tiles.
