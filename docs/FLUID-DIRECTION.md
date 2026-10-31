# Fluid cinematic refinement: direction and motion specification

Branch `feature/fluid-cinematic-refinement`, from `main` at `1053759`. The root remains the Reclaim exhibition gallery.

## What was observed versus inferred (reference: edoardosmerilli.com)

Observed in a real browser (Chromium, headless, 1440x900):
- Fonts, from `document.fonts`, the `@font-face` rules and computed styles: **Tusker Grotesk** (condensed grotesque, used for small category labels), **Suisse Intl** (neo-grotesque, nav and UI, 14.4px uppercase) and **RL Unno** (high-contrast display serif, the project titles). All three are proprietary families served from the reference's own `/fonts/` folder.
- A numeric loader ("100") that clips a photograph, then a full-viewport project scene with the title centred, an "Explore project" line, "All projects" bottom-left and a circular control bottom-right that shows a counter and then an arrow.
- Pressing and holding on the scene produced no page change within 5 s in headless frames; the screenshot cadence (about 600 ms per frame on a software renderer) was too coarse to capture the deformation ramp or its completion threshold.

Inferred (not observed live): the lens/bulge ramp, its duration, the early-release spring and the archive press response. These come from the supplied screenshots and the written brief. The 560 ms hold threshold here is therefore our choice inside the brief's 450-700 ms range, not a measured value.

## Typeface decision (licensing)

The reference's fonts are commercial and are neither downloaded nor redistributed. This site uses legally usable open-licence (SIL OFL) families from Google Fonts:
- Display and editorial: **Playfair Display** (variable weight and italic), the closest free match to RL Unno's high contrast, ball terminals and wide proportions. Its variable `wght` axis is what the title response drives.
- Interface and body: **Inter Tight**, standing in for Suisse Intl.
- Utility labels use Inter Tight in small uppercase with tracking (no separate mono face).
- Tusker Grotesk's condensed role has no counterpart; condensed type is deliberately not simulated by squashing.

Replaced: Instrument Serif, Fraunces, Cormorant Garamond, DM Serif Display, Bebas Neue, Hanken Grotesk, IBM Plex Mono and JetBrains Mono. Project identity now comes from imagery, colour and composition.

## Interaction model

- **Gallery** (`index.html`, `assets/js/home.js`): one composed viewport. Arrows change the selected project; a counter shows position. Header links remain. No tick bars, corner triangle, hints, duplicate collection or footer.
- **Enter the current project**: click/tap/Enter on the title or the labelled "Enter project" action, or a deliberate ~560 ms hold on the artwork. Hold never selects the next project. A hold cancelled by release, movement (>14 px), blur or tab change relaxes back with a short spring and creates no history entry. Reduced motion: no hold, direct navigation.
- **Lens surface** (`assets/js/lens.js`): one WebGL canvas, created once, DPR capped at 1.5, drawn only during a gesture. The artwork is a texture on a quad: a local lens magnifies around the pointer and grows while held; on completion it opens into a 2.2x zoom about the pointer. Only the artwork deforms; header, controls and titles are DOM. No WebGL, context loss or reduced motion: a plain scaled still (`.lens--css`), no distortion claimed.
- **Continuity** (`assets/js/arrive.js`): the destination's `<head>` script paints the same artwork at the lens end-frame (2.22x about the same point) before first paint; `site.js` settles it (scale to 1, fade) once the page hero is decoded; a 4.5 s timeout guarantees removal. Before the hand-off the destination HTML is fetched and its first images decoded (bounded). Failure falls back to ordinary navigation.
- **Next project** (project rail and the closing panel): runs the same lens to the next project in the shared order (`assets/js/projects.js`), wrapping after the last. The next title appears only in that active transition and in the closing panel of a story.
- **Title response** (`assets/js/title-fx.js`): letters near a fine pointer lean away, swell slightly and shift variable weight, then spring back; the text is duplicated for assistive technology and the letters are `aria-hidden`.
- **Project rail**: close, chapters (popover, desktop only), project title, one primary action, next. No numbers, counters, boxes, corner triangle or resting next-project name. The native scrollbar lane (16 px) is still reserved. On phones it becomes a compact bottom bar respecting safe areas.
- **Scroll**: unchanged single-owner damped engine (`story.js`); the scene indicator and progress displays were removed, the engine and its tests remain.
- **Archive**: fixed title and controls; three depth layers; velocity tilt; plus a press lens that swells and pushes the fragments around the pointer (DOM transforms on fragments only, removed at rest).
- **Project index**: neutral idle (solid near-black, outlined titles, nothing previewed). Hover or keyboard focus fills that title and shows its clean image; leaving restores neutral unless a title holds keyboard focus. Touch: tap previews, an explicit "Open <name>" button opens; a label states this before any tap.
- **Kaal crow** (`assets/js/kaal.js`): the app's real runtime sheet and animation strips with the app's frame timings, anchor (128, 243) and click rules (450 ms gap, 2.5 s settle). Idle with blink; the pointer only makes it attentive; one click notices then plays a strip (ruffle, preen, scratch, stretch in rotation); two quick clicks flinch; three or more take off with the full wing-beat strip and land elsewhere. Pauses offscreen and when hidden. Reduced motion: no timers or loops; the button shows still poses.

## Speed and cognitive-load plan
- Budget (measured locally, uncached): home 19 requests / ~0.76 MB, index 0.39 MB, profile 0.22 MB, a story 1.1-2.8 MB. Fonts are self-hosted latin subsets (~145 KB total), preloaded once; no third-party requests.
- One idea per screen: the gallery shows one project, two arrows and a counter; each story scene has one dominant image or statement; one primary action per hero, the rest in the rail or ending; no persistent progress, counters or next-project names.
- Loading: only the active gallery slide and its neighbours are hydrated; story images are lazy; Aureledger's 32-frame intro loads only when its panel is near (2 at a time); the Archive loads the initially visible fragments eagerly and the rest lazily; the lens/WebGL runs only during a gesture; the crow and videos load on demand.
- Next steps if more is needed: AVIF/WebP derivatives for story JPEGs, a smaller Archive derivative set, and moving Aureledger frames to a single sprite/video.
