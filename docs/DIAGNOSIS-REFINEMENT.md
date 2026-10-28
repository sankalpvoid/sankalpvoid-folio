# Diagnosis before the refinement pass (HEAD 9efac04)

| Symptom | Cause found in the code |
|---|---|
| Archive title drags with the artwork | `.ar__title` is a child of `.ar__canvas`, so it inherits the canvas `translate3d`. Everything (title, tiles) is one rigid layer with a single transform. |
| Archive feels like a sliding rectangle | One transform, no depth: no per-layer rates, no velocity-dependent perspective, inertia is a plain `*0.94` per frame (frame-rate dependent). |
| Drag highlights text/images in orange | `user-select` is only disabled on `.ar__view` and `.enter`. Headings, hero copy, the story track and tiles stay selectable; `::selection` is orange (`--sig`), so any drag across them paints it. Images in stories/index have native drag enabled. |
| Page-drag opens the wrong thing | `unroll.js` is attached to every slide's **Enter** link, so the drag *enters the current project*; inside projects it is attached to the last panel and reveals a static still. There is no shared project order, no label for the destination and the reveal is a horizontal clip (`inset(0 0 0 …)`), not a corner peel. |
| Stories advance too far, too fast | `story.js` maps vertical scroll 1:1 to horizontal pixels and renders the scroll position directly (no target/rendered split, no velocity limit), so a trackpad flick or wheel burst crosses several 100vw-wide panels. Panels were also dense (3-6 equal-weight images). |
| No persistent project controls | Only a bottom chapter bar exists inside the pin; no rail, no close/next/primary action on screen while reading. |
| Profile: orange, silhouette, collisions | `profile.css` hard-codes `#ff7b4d/#ff8a63/#ff5b2e`; the sketch SVG is the only portrait; `--prv` starts at `.14`, so a 14% slit is visible at the first frame; seven phrases are absolutely stacked in one centred box and fade over each other (dimmed previous phrase remains at 12%), the portrait sits behind every paragraph. |
| Index shows competing text | `assets/img/idx/*.jpg` were produced from full-page captures (hero screenshots with their own copy). On touch the first tap previews and the second opens, with no explicit label until after the first tap. |
| Last deployment check gap | axe was not rerun after the WealthWithSG fix; the suite ran only against localhost. |

Decisions: one shared project registry (`assets/js/projects.js`); separate layers in Archive; a diagonal peel with a real fold polygon; a single rAF loop in the story engine with frame-rate independent damping and a velocity cap; a fixed right-hand rail; Profile rebuilt as four scenes using the supplied portrait behind an animated mask.
