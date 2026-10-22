# Design notes

## Idea

*Each project is an exhibition. Together, they reveal the person who made them.*

The home page is a gallery entrance, not an introduction: it opens on a featured project with the maker's name kept small. Each exhibition then gets its own world, built from that project's real material.

| Exhibition | Ground | Type | What carries the story |
|---|---|---|---|
| 01 Reclaim | warm paper, one violet from the product | Instrument Serif + Inter Tight | real prototype screens, an interactive viewer, decisions beside a sticky phone |
| 02 WealthWithSG | near-black, hairlines, one brass | Cormorant Garamond | an original SVG chart that settles from noise to structure; the live site's six frames |
| 03 Sankalp & Shristi Furnishers | ivory, charcoal, brass | Fraunces | a scroll-linked sequence of the live hero prototype, lines to bed |
| 04 Experiments | dark specimen sheet, mono labels | Instrument Serif + JetBrains Mono | real previews; live studies load only on request |

Shared: the `sankalpvoid` wordmark top-left, `Projects / About / Contact` top-right, an orange signal dot as the only recurring accent, hairline rules, mono captions.

References studied: edoardosmerilli.com (full-bleed project-led entrance, restrained corner navigation, circular enter action, "all projects" control) and the two project sites. Composition, type, palette, transition choreography and copy are original; nothing was reused from the reference.

## Motion system

One curve family and three tiers, defined as tokens in `assets/css/base.css`.

| Tier | Token | Used for |
|---|---|---|
| Scene | `--t-scene` .9s, `--ease-io` | gallery slide wipe, page transitions (shared-element morph from the gallery composition to the project hero) |
| UI | `--t-ui` .34s, `--ease-out` | menus, tabs, reveals, underline draws |
| Micro | `--t-micro` .16s | hover and press feedback |

- **Page transitions:** CSS cross-document View Transitions. The active slide's composition and the project hero share `view-transition-name: exhibit`, so the gallery visibly expands into the project opening. Browsers without support navigate normally.
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
- Live experiments (CyberPunk plays a 300-frame canvas) are screenshots until the visitor clicks "Try it here".
- Image assets are immutable-cached; CSS and JS revalidate (`vercel.json`).

## Honesty rules applied

Screens are labelled as prototype captures with sample data. Studio renders are labelled placeholder. Sample content is called sample. No metrics, testimonials, research or outcomes appear anywhere. Health and finance content carries the caveats its source projects use.
