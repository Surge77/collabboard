---
version: 1
slug: "src-app-board-id-page-tsx"
primary_target: "src/app/board/[id]/page.tsx"
related_targets: ["src/app/page.tsx","src/app/(dashboard)/dashboard/page.tsx","src/app/(auth)/login/page.tsx"]
---

# Surface brief: CollabBoard app (board editor, dashboard, landing, login)

Scope: whole web app. Modes: board editor + dashboard = Operate; landing = Persuade; login = Operate.
Audience/job: small remote product/eng teams diagramming together; reviewers in a short demo (PRODUCT.md).
Constraints: tldraw owns canvas + its chrome; app controls live outside it. Owner pinned pro-neutral (one sans, straight 6–8px radii, soft shadows). No hand-drawn/paper look.

## Direction contract

THESIS: The chrome speaks the same box-and-connector notation the AI draws; it refuses the floating-pill-toolbar-over-canvas arrangement every whiteboard clone ships.

OWN-WORLD: White/graphite neutrals (#FFFFFF, #16181D; dark #16181D/#E8EAEF), one ink-blue action color (#2D5BFF light / #5B82FF dark) used only on primary actions and focus, 1px hairline borders, small square port marks where a control attaches to what it opens, Geist sans throughout, tabular figures for every live number.

STORY: A visitor sees a sentence become a connected diagram, understands AI draws for the whole room, opens a board, and finds every tool in one rail beside the canvas.

FIRST VIEWPORT: Landing: left column headline + one primary action; right two-thirds a product frame: canvas with an AI prompt node wired by a connector into a generated 4-node flow, two labeled collaborator cursors, the right rail and open AI panel. Board: full-bleed canvas, 48px right rail, 320px docked panel; active rail tab joined to its panel by a 1px connector with a square port.

FORM: Diagram Notation, rank 1 of my grounded list (chosen as IMPECCABLE'S PICK over the rolled Retro Wall); seed key fd3724f9.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
