---
name: CollabBoard
description: A real-time whiteboard where AI turns a sentence into a diagram the whole team edits, with chrome drawn in the same box-and-connector notation.
colors:
  accent: "#2d5bff"
  accent-hover: "#1f47e0"
  accent-ink: "#ffffff"
  accent-text: "#2448d8"
  background: "#f6f7f9"
  surface: "#ffffff"
  raised: "#ffffff"
  hover: "#f0f1f4"
  selected: "#e6e8ee"
  foreground: "#16181d"
  ink-soft: "#5b6170"
  line: "#e3e5ea"
  line-strong: "#8a90a0"
  danger: "#c9302c"
  danger-soft: "#fdecec"
  accent-dark: "#5b82ff"
  accent-hover-dark: "#7896ff"
  accent-ink-dark: "#0b1020"
  accent-text-dark: "#8aa6ff"
  background-dark: "#0f1115"
  surface-dark: "#16181d"
  raised-dark: "#1c1f25"
  hover-dark: "#22252c"
  selected-dark: "#2a2e37"
  foreground-dark: "#e8eaef"
  ink-soft-dark: "#a0a6b4"
  line-dark: "#2a2d35"
  line-strong-dark: "#6b7180"
  danger-dark: "#ff6b66"
  danger-soft-dark: "#3a1d1f"
  canvas-dark: "#121419"
typography:
  display:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.03em"
    fontFeature: "'ss01'"
  headline:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
    fontFeature: "'ss01'"
  title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.43
    letterSpacing: "normal"
    fontFeature: "'ss01'"
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "normal"
    fontFeature: "'ss01'"
  body-compact:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.375
    letterSpacing: "normal"
    fontFeature: "'ss01'"
  label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.375
    letterSpacing: "normal"
    fontFeature: "'ss01'"
  caption:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.33
    letterSpacing: "normal"
    fontFeature: "'ss01', 'tnum'"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "40px"
  3xl: "64px"
  rail: "48px"
  panel: "320px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
    textColor: "{colors.accent-ink}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "36px"
  button-secondary-hover:
    backgroundColor: "{colors.hover}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "36px"
  button-ghost-hover:
    backgroundColor: "{colors.hover}"
    textColor: "{colors.foreground}"
  button-danger:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.danger}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "36px"
  button-danger-hover:
    backgroundColor: "{colors.danger-soft}"
  button-sm:
    padding: "0 10px"
    height: "32px"
  icon-button:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.md}"
    size: "36px"
  icon-button-sm:
    size: "32px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 10px"
    height: "36px"
  rail:
    backgroundColor: "{colors.surface}"
    width: "{spacing.rail}"
    padding: "12px 0"
  rail-tab:
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.md}"
    size: "36px"
  rail-tab-active:
    backgroundColor: "{colors.selected}"
    textColor: "{colors.foreground}"
  dock-panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    width: "{spacing.panel}"
    padding: "16px"
  floating-surface:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "12px"
  board-row:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    padding: "8px 12px"
    height: "56px"
  board-row-hover:
    backgroundColor: "{colors.hover}"
  tag:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    typography: "{typography.caption}"
    rounded: "{rounded.sm}"
    padding: "2px 6px"
---

# Design System: CollabBoard

## Overview

**Creative North Star: "Diagram Notation"**

The chrome speaks the same box-and-connector language the AI draws on the canvas. Controls are boxes drawn with 1px hairlines; where one thing opens or feeds another, a thin connector meets it at a small square port. The result reads as a professional tool of its category (Figma, Linear, tldraw's own panels) rather than a playful whiteboard clone: graphite neutrals, one ink-blue action color, one sans family, straight small radii.

The canvas is the product, so the chrome is dense and quiet. All app controls live in a single 48px rail on the right edge of the board, outside tldraw's canvas, and every rail tab opens into the same 320px docked panel; on wide screens the canvas shrinks to make room instead of being covered. The system refuses the floating-pill-toolbar-over-canvas arrangement every whiteboard clone ships. Depth is flat at rest; a soft shadow appears only on surfaces that genuinely float over the canvas.

Both themes are first-class. Every text pair clears 4.5:1 and every field boundary and focus line clears 3:1 in light and dark (WCAG 1.4.3 / 1.4.11), which is why interactive boundaries use the strong line and never the structural one. The owner has rejected the editorial "AI house style" (serif mastheads, ivory paper, mono small-caps labels, staggered reveals) and any hand-drawn or paper look.

**Key Characteristics:**
- Graphite neutrals plus a single ink-blue action color.
- 1px hairlines everywhere; square 7px ports where a connector attaches.
- Geist sans throughout with stylistic set `ss01`; tabular figures for live numbers.
- One right rail, one docked panel; nothing app-owned floats over tldraw's chrome.
- Flat at rest; one shared soft shadow for floating surfaces only.

## Colors

A cool graphite neutral family carries almost everything; one saturated ink blue marks the action, and a muted red marks destruction.

### Primary
- **Ink Blue** (`accent`, dark `accent-dark`): fills primary buttons, the on-state of switches, text selection, the 2px focus outline, the accent box in the wordmark, and the AI prompt node and its connector in the landing diagram. Hover deepens to `accent-hover` in light and lightens in dark.
- **Ink Blue Text** (`accent-text`): the accessible text and line variant of the accent: link-like actions such as the toast's Undo, the focused field border, and accent-colored labels inside diagrams.
- **Ink On Blue** (`accent-ink`): text on an accent fill (white in light, near-black navy in dark).

### Neutral
- **Workspace Grey** (`background`): page background behind the dashboard and landing; the step boxes in onboarding sit on it.
- **Sheet White / Graphite Sheet** (`surface`): headers, rail, dock panel, field fills, secondary buttons.
- **Raised** (`raised`): popovers, toasts, timer chip, inline confirms; one step lighter than `surface` in dark so floating surfaces separate without heavier shadows.
- **Hover Wash** (`hover`) and **Selected Wash** (`selected`): row and control hover; the active rail tab and the off-state switch track.
- **Graphite Ink** (`foreground`): primary text and the inverse fill of count badges and cursor chat.
- **Soft Ink** (`ink-soft`): secondary text, idle icons, placeholders, captions, connector arrowheads.
- **Hairline** (`line`): structural dividers: header bottoms, panel edges, row separators, section rules.
- **Strong Hairline** (`line-strong`): interactive boundaries (fields, secondary and danger buttons, tags, the row icon box), connectors and ports in chrome, scrollbar thumbs.
- **Canvas Graphite** (`canvas-dark`): tldraw's dark canvas, pulled one step below the chrome so canvas and chrome read as one world.

### Tertiary
- **Signal Red** (`danger`) with **Danger Wash** (`danger-soft`): text of danger buttons and destructive icon hovers, error messages, the elapsed timer; the wash is the danger button's hover fill.

### Named Rules
**The One Ink Rule.** The accent is reserved for the primary action, on-state, selection and focus. Everything else is neutral; a second accent-filled control on the same view means one of them is wrong.

**The Two Lines Rule.** `line` divides structure; `line-strong` bounds anything you can type into or press. Never draw a field, secondary button or tag with the structural line: it fails 3:1.

## Typography

**Display Font:** Geist (with system-ui, sans-serif)
**Body Font:** Geist (with system-ui, sans-serif)
**Label/Mono Font:** Geist Mono is loaded but not used in the shipped chrome.

**Character:** One neutral grotesque at a few tight weights (400, 500, 600) with `ss01` on globally. Hierarchy comes from size and weight with negative tracking on large headings, never from a second family.

### Hierarchy
- **Display** (600, 36px rising to 48px from 640px, 1.08, -0.03em): the landing headline only, balanced wrapping.
- **Headline** (600, 24px rising to 30px, -0.02em): landing section headings; dashboard and onboarding headings use 20px at -0.01em.
- **Title** (600, 14px): dock panel titles, list headings, feature names, thread authors at 13px.
- **Body** (400, 14px, 1.625): running copy, capped at 52-60ch on the landing; 16-18px for the landing lede.
- **Body Compact** (400, 13px, 1.375): panel descriptions, comment bodies, confirm messages, footers. The most used size in the chrome.
- **Label** (500, 13px): form labels and small-button text.
- **Caption** (400, 12px, tabular): dates, tags, status text, errors.

### Named Rules
**The Tabular Rule.** Every number that changes or lines up (timer, badge counts, avatar overflow, edit dates) uses tabular figures in a fixed-width cell so it never jitters.

**The One Family Rule.** Geist sans only. No serif display, no mono labels, no uppercase-tracked eyebrows above headings.

## Layout

Two spatial models. The **board** is full-bleed: a 48px top header, the tldraw canvas filling the rest, and on the right a 48px rail (`spacing.rail`) with an avatar stack, a 24px divider, then 36px tabs with 4px gaps. The open tab's panel docks between canvas and rail at 320px (`spacing.panel`) from 768px up; below that it overlays the canvas at `min(320px, 100vw - 3rem)` with the floating shadow. Panel header is 48px; panel body pads 16px with 16px gaps.

The **site and dashboard** use a centered 1152px column (`max-w-6xl`) with 16px gutters on phones and 24px from 640px. The landing hero splits 4fr / 8fr from 1024px, text left, product frame right. Sections are separated by full-width hairlines and alternate `background` and `surface` bands, with 56-80px vertical padding. Boards are a list of 56px rows, not a card grid.

Spacing runs on the 4px Tailwind base; the reused steps are 4, 8, 12, 16, 24, 40 and 64px. Density is desktop-tight (32-36px controls) and coarse pointers get 44px hit areas through a `pointer-coarse` override rather than a looser desktop layout. Breakpoints: 640px, 768px, 1024px.

## Elevation & Depth

Flat by default. Depth comes from tonal steps (`background` → `surface` → `raised`) and hairlines. A single shadow token exists, `shadow-pop`, and it belongs only to surfaces that float above the canvas or page: the overlay dock panel on narrow screens, the timer chip, comment thread popovers and pins, cursor chat, and the undo toast. The docked panel on wide screens drops its shadow because it sits beside the canvas, not over it.

### Shadow Vocabulary
- **Pop** (light `box-shadow: 0 1px 2px rgb(16 24 40 / 0.06), 0 8px 24px rgb(16 24 40 / 0.12)`; dark `0 1px 2px rgb(0 0 0 / 0.4), 0 8px 24px rgb(0 0 0 / 0.5)`): anything floating over content.

### Named Rules
**The Float-Only Shadow Rule.** If a surface is docked, inline or part of the page flow, it has a hairline and no shadow. Shadow means "this sits on top of the canvas".

## Shapes

Small straight radii: 6px (`rounded.md`) for buttons, icon buttons, fields, rail tabs, inline confirms and onboarding steps; 8px (`rounded.lg`) for floating surfaces (popovers, toasts, timer chip) and the onboarding frame; 4px (`rounded.sm`) for tags and the board-row icon box. Full rounds are only for avatars, count badges and the switch. Speech-like elements (comment pins, cursor chat) square off their bottom-left corner to point at their anchor.

The signature shape is the **port**: a 7×7px square with a 1px `currentColor` border and a `surface` fill, joined to its target by a 1px connector in `line-strong`. It appears where something attaches to something: the active rail tab to its panel, the landing step timeline, onboarding steps, and the landing diagram's prompt node.

### Named Rules
**The Port Rule.** A port marks a real connection. Use it only where a connector meets a node or a control meets what it opens; never as a bullet, divider ornament or decoration.

## Components

### Buttons
Quiet and exact: flat fills, hairline outlines, 150ms color transitions, no lift.
- **Shape:** gently squared corners (6px).
- **Primary:** Ink Blue fill with Ink On Blue text, 36px tall, 14px horizontal padding, 14px medium text. One per view.
- **Secondary:** surface fill with a `line-strong` border and Graphite Ink text; hover washes to `hover`. The default variant.
- **Ghost:** no fill, Soft Ink text; hover washes to `hover` and darkens to Graphite Ink.
- **Danger:** secondary shape with Signal Red text; hover fills with Danger Wash.
- **Small:** 32px tall, 10px padding, 13px text. Used in panels, popovers and headers.
- **Disabled:** 45% opacity, not-allowed cursor, hover suppressed.
- **Focus:** global 2px Ink Blue outline at 2px offset.

### Icon Buttons
36px (or 32px small) squares, 6px radius, Soft Ink idle, `hover` wash with Graphite Ink on hover. Every icon button carries an accessible label and title. Icons are one authored set on a 20px grid with a 1.6 stroke and round joins, drawn to sit at the same weight as tldraw's icons.

### Tags
Hairline-outlined (`line-strong`) 4px-radius labels in 12px Soft Ink, e.g. "Public" on a board row. No fill.

### Inputs / Fields
- **Style:** surface fill, 1px `line-strong` border, 6px radius, 36px tall (44px on coarse pointers), 10px horizontal padding, 14px text, Soft Ink placeholder. Textareas share the chrome with 8px vertical padding and no resize.
- **Hover:** border darkens toward Graphite Ink at 60%.
- **Focus:** border shifts to Ink Blue Text; the field's own outline is suppressed in favor of the border.
- **Labels:** 13px medium Graphite Ink above the field.
- **Disabled:** 45% opacity.

### Navigation: Board Rail
The board's only strip of app tools: a 48px surface column with a hairline left edge. Tabs are 36px icon squares; the active tab takes the `selected` wash and Graphite Ink, and grows a 6px connector plus a port out of its left edge toward the open panel. Open-thread counts sit in a 16px Graphite Ink badge with tabular 10px figures. The site header is a 56px surface bar with a hairline bottom, wordmark left, theme toggle and one small button right.

### Dock Panel
The single panel every rail tab opens into: 320px surface column, hairline left edge, 48px header with a 14px semibold title and a small close icon button, an optional 13px Soft Ink description band divided by a hairline, then a 16px-padded scrolling body. Esc closes it and returns focus to its tab; clicking the canvas does not.

### Floating Surfaces
Popovers (comment threads, 288px wide), the timer chip and the undo toast share one recipe: `raised` fill, hairline border, 8px radius, Pop shadow, 12px padding. The toast sits bottom-centre with a ghost "Undo" in Ink Blue Text. Destructive confirmations are not modals: an inline confirm box (strong hairline, 6px radius, raised fill) appears next to the item with focus on Cancel.

### Board Rows
Boards are listed as 56px rows divided by hairlines, not cards: a 32px outlined icon box showing two nodes and a connector, the title in 14px medium (underlines on hover, whole row clickable), an optional Public tag and a tabular edit date. Row actions (rename, duplicate, delete) overlay the right edge on hover or focus and are always visible on touch.

### Diagram Frame (signature)
On the landing hero and in onboarding, the product explains itself in its own notation: outlined node boxes, 1px connectors with small arrowheads in Soft Ink, and ports where edges leave a node. The AI prompt is the one node drawn in Ink Blue. With motion allowed, connectors draw in once over 900ms and nodes fade in over 400ms on an expo-out curve (`cubic-bezier(0.16, 1, 0.3, 1)`); with reduced motion everything is simply present.

## Do's and Don'ts

### Do:
- **Do** keep the accent to one primary action per view, plus on-states, selection and focus.
- **Do** bound every field, secondary button and tag with `line-strong` (≥3:1); use `line` only for structural dividers.
- **Do** put new board tools in the right rail and open them in the dock panel at 320px.
- **Do** use a port and a 1px connector where a control attaches to what it opens, and nowhere else.
- **Do** use `shadow-pop` only on surfaces that float over the canvas or page; dock beside, don't float over.
- **Do** set every live or aligned number in tabular figures.
- **Do** give coarse pointers 44px targets with `pointer-coarse` overrides instead of loosening desktop density.
- **Do** confirm or offer undo for anything that changes the board for everyone, inline next to the item.

### Don't:
- **Don't** float pill toolbars or app controls over the tldraw canvas or its own menus.
- **Don't** introduce a second accent hue, gradients, or an accent-filled secondary action.
- **Don't** add a serif or mono display face, uppercase tracked eyebrows, ivory paper textures, hand-drawn strokes, or staggered reveal choreography.
- **Don't** use radii above 8px on chrome, or pill shapes outside avatars, badges and the switch.
- **Don't** add shadows to docked or in-flow surfaces, or use heavier shadows than Pop.
- **Don't** use translucent white panels with backdrop blur; surfaces are opaque theme tokens.
