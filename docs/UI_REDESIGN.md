# Frontend redesign notes

## Intent

The redesign uses an editorial identity rather than neon gradients, decorative emoji, large icon tiles or a floating chatbot. It keeps the breadth of the SRS without presenting every feature as a competing primary action.

The journal is the entry point. Explore is the search workspace. Events and Showcase remain distinct. Personal controls sit in the account menu. The optional assistant is a clearly named secondary destination, not the dominant brand element.

## Visual system

| Token | Light | Dark | Purpose |
|---|---|---|---|
| Page canvas | #f6f5f0 | #161d1b | Low-noise reading background |
| Primary ink | #172d2a | light text token | Hierarchy and body text |
| Accent | #294b40 | #d4dfb8 | Primary actions and focus emphasis |
| Headings | Georgia / system serif | same | Editorial rhythm |
| Body/controls | System sans-serif | same | Readability and platform familiarity |
| Corners | Restrained small radii | same | Consistency across controls |

No font files are supplied. SVG icons are functional line drawings: search, menu, arrows, bookmark and reading controls. Numbered labels 01-08 replace home category pictograms. Sparkle glyph references are removed from UI code. The scanner checks first-party TS/TSX/CSS and artwork for emoji presentation characters; it intentionally does not prohibit users from typing their own text.

## Page composition

Home: journal masthead, cover story, numbered category directory, four curated readings, event agenda and submission invitation. Mobile stacks the cover and reading cards and retains two-column short category labels.

Explore: search and filter controls stay useful rather than decorative. Category labels are text-led. Results preserve grid/list modes, pagination, empty state and reset controls.

Account: dashboard, bookmarks/notes and profile retain their existing demo workflows. The desktop account dropdown now exposes logout directly. A stored theme preference is respected instead of being silently reset.

Admin: shared typography, neutral panels, clear table actions and status labels. Editing, feedback and moderation remain discoverable. Administrative styling does not replace server authorization.

## Accessibility and review

Retained: keyboard search, labelled controls, breadcrumbs, modal keyboard handling, reduced-motion handling, theme and text-size controls, error/loading/empty states and sitemap. Visual/layout tests are not a formal WCAG audit. Before submission, test keyboard-only use, a screen reader, contrast, zoom, long Vietnamese text and real mobile devices.

The initial content remains English and fictional. Internationalization is not implemented. Original demo illustrations remain; removing emoji is not a promise about the appearance of generated material or any detector's output.
