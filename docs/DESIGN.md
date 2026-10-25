# Design notes

## Idea

*Each project is an exhibition. Together, they reveal the person who made them.*

The home page is a gallery entrance, not an introduction: it opens on a featured project with the maker's name kept small. Pass 2 turned each slide into a full-viewport **scene** built from the project's own material, and the project page opens on the same scene (shared-element transition). The full per-exhibition spec is in `ART-DIRECTION.md`.

| Exhibition | Scene | Signature | Story rhythm |
|---|---|---|---|
| 01 Reclaim | the app's own glass-flower art, one large craving-support screen rising from the edge, rings breathing 4‑4‑4‑4 | a breathing orb you start yourself | one evening in five beats, from real screens and a real recording |
| 02 WealthWithSG | a chart that fills the viewport behind the title | move across the chart (pointer or slider) from noise to structure | six real frames in a sideways strip, then three decisions |
| 03 Furnishers | architectural hairlines and the bed render, registered to traced geometry | lines → slats → frame → render → room on one stable stage | transformation, materials, authentic before/after, configurators |
| 04 Aureledger | the real receipt from the live intro, bleeding off the right edge, on ink navy with copper only for the selected purchase | paper feeds up into the slide; a "does it count as spending?" quiz on the app's actual accounting rules | one sticky frame beside four steps (purchase, strip, month, history), the quiz, three decisions |
| 05 Experiments | three tall strips of the real studies at different crops | strips drift at different rates with the pointer | three bands, each composed differently |

Shared: the `sankalpvoid` wordmark top-left, `Projects / About / Contact` top-right, hairline rules, mono captions.

References studied: edoardosmerilli.com (full-bleed project-led entrance, restrained corner navigation, circular enter action, "all projects" control) and the two project sites. Composition, type, palette, transition choreography and copy are original; nothing was reused from the reference.

## Motion system

One curve family and three tiers, defined as tokens in `assets/css/base.css`.

| Tier | Token | Used for |
|---|---|---|
| Scene | `--t-scene` .9s, `--ease-io` | gallery slide wipe, page transitions (shared-element morph from the gallery composition to the project hero) |
| UI | `--t-ui` .34s, `--ease-out` | menus, tabs, reveals, underline draws |
| Micro | `--t-micro` .16s | hover and press feedback |

- **Gallery transitions:** one per exhibition, made of what it reveals: an iris opening from the breathing rings (Reclaim), a brass time-cursor sweep (WealthWithSG), hairlines widening into the surface (Furnishers), three strips arriving at their own speeds (Experiments). The outgoing scene sinks and dims. Reduced motion switches slides instantly.
- **Page transitions:** CSS cross-document View Transitions. The active slide's scene and the project hero share `view-transition-name: exhibit`, so the scene carries into the project opening. Browsers without support navigate normally.
- **Pointer:** a few pixels of depth on the gallery (fine pointers only), underline and fill feedback on controls. Nothing follows the cursor.
- **Touch:** swipe changes exhibitions; every hover-only reveal has a tap or focus equivalent.
- **Scroll:** never hijacked. One sticky sequence (Furnishers) with a skip link; the Reclaim phone is `position: sticky`, not scroll-jacked.
- **Reduced motion:** transitions are disabled, reveals are shown immediately, the Furnishers sequence becomes a static contact sheet, the WealthWithSG chart rests on its final state, the gallery changes slides instantly.
- **Failure:** reveal hiding is opt-in from JavaScript and fails open (a timer reveals anything the observer missed). With JavaScript off, every page is readable.
- **Cleanup:** the project index dialog and live experiment iframes are created on demand and removed on close; scroll listeners are attached only while the sequence is near the viewport.

## Performance choices

- No framework, no animation library, no WebGL. Transforms and opacity only.
- Only the first gallery slide's images are fetched eagerly; neighbours are hydrated when idle.
- Responsive images (`srcset`) for captures; `width`/`height` on every image to avoid layout shift; lazy loading below the fold.
- Live experiments (CyberPunk plays a 300-frame canvas) are screenshots until the visitor clicks "Try it here". The Reclaim recording is `preload="none"`, plays only while on screen, and pauses when scrolled away.
- The Furnishers stage is native SVG (22 KB of traced paths) over one render, not a stack of screenshots.
- Image assets are immutable-cached; CSS and JS revalidate (`vercel.json`).

## Honesty rules applied

Screens are labelled as prototype captures with sample data. Studio renders are labelled placeholder. Sample content is called sample. No metrics, testimonials, research or outcomes appear anywhere. Health and finance content carries the caveats its source projects use.
