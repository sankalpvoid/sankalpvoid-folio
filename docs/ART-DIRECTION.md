# The homepage and the personal pages (pass 4)

The site used to open straight on the first exhibition. It now opens on a **foyer**: a page about the person, with the collection one step further in. Journey: *meet me → discover what I build → enter an exhibition → explore further or get in touch.*

## Homepage `/` · "The foyer"

| | |
|---|---|
| **Central idea** | Contour lines around a figure: a silhouette surrounded by ripples, like a topographic map or a signal. It ties the engineering (terrain, water, signals) to the portrait without drawing a face, and it is the one piece of imagery the page owns. |
| **Typography** | **Instrument Serif** for statements, with the second half of the anchor in italic orange; **Inter Tight** for text; **JetBrains Mono** for small labels. |
| **Palette** | A lobby, not an exhibition: warm bone `#efeae0` ground, ink `#0d0d0f` type, and one signal orange (`#ff5b2e` for graphics, `#b5340f` for text so it passes contrast). Side B inverts to ink, the other side of the record. |
| **Image treatment** | The portrait is an illustrative sketch (placeholder, no likeness). Exhibition imagery is real, cropped hard into an uneven mosaic rather than a row of identical cards. |
| **Composition** | Identity first: the anchor statement and one primary action beside the portrait. Then *Now showing* (a tall Reclaim tile, a wide Aureledger tile, two mid tiles, a strip of experiments), *Different disciplines. Same impulse.* (five threads with an orbit that follows the reading), *Side B* (dark), and an open-channel footer. |
| **Hierarchy of actions** | One solid button, "Explore the work". "Meet me", "Hear the music" and "Say hello" are quiet underlined links. Each exhibition is also reachable straight from its tile. |
| **Signature interaction** | The portrait: the sketch draws itself once, and responds to the pointer (rings drift, the orbit dot travels). When a photograph is supplied the sketch becomes a reveal into the photo. |
| **Motion** | A small number of moments: the sketch drawing in, content easing up as it enters, the orbit lighting the thread being read, and a clicked tile's picture becoming the opening of its exhibition (a view transition). All of it stops under reduced motion. |
| **What it avoids** | Faint text, empty space, repeated statements about curiosity (the anchor appears once on the homepage and the About page opens differently), abstract graphics that delay the work, purple glow. |

## About `/about/` · "Meeting me"

- **Opening:** "Hello. I'm Sankalp." with the portrait and three short paragraphs in the first person.
- **A pattern in the work:** four exhibitions, each with the single habit that is visible in it (saying what a number, chart or image is and isn't), linked to the exhibition. This is the evidence for the claim that the threads connect, in place of a list of skills.
- **Right now:** four short lines taken from the earlier portfolio and the GitHub profile.
- **Side B (`#music`):** the dark half of the record: vocals, guitar, production, the two verified channels, and a deliberately player-free section.
- **Onward:** two large routes, to the work and to contact.

## Navigation conventions

- **Header, every page:** wordmark → Home; *Work* opens the All-projects overlay (and links to `/projects/` without JavaScript); *About*; *Music* → `/about/#music`; *Contact*.
- **Exhibitions** add a "← Collection" crumb that returns to that exhibition's slide in `/projects/#slug`.
- **`/projects/`** is the immersive collection (the former homepage). Its list of all projects sits below it and feeds the overlay.
- **Old links:** `/#reclaim` and the other exhibition hashes redirect to `/projects/#…`; `#about` and `#lab` go to the About page (`#lab` to "Right now"); `#work` and `#side-b` still land on the matching homepage sections.

---

# Art direction, pass 2

Pass 1 produced a polished editorial portfolio: a text-left hero, then a conventional case study. Pass 2 makes the work the environment. Each gallery slide is a full-viewport **scene**; the project page opens on the *same scene* (shared-element transition), then the story unfolds in that project's own language.

Reference lesson (edoardosmerilli.com, inspected in a browser): one full-bleed piece of the work owns the whole viewport; the title is large and sits *in* the image; chrome is tiny; "All projects" is a typographic list. Nothing explains the work before showing it.

Shared foundations (unchanged): routes, header, `Projects / About / Contact`, All projects overlay, gallery controls (prev / next / ticks / counter), focus management, reduced-motion and no-JS fallbacks, motion tokens.

---

## 01 · Reclaim — "One evening, one urge"

| | |
|---|---|
| **Central idea** | A single calm night. The page is the quiet around one craving, and a 4‑4‑4‑4 breath (the app's own box-breathing rhythm) is the metronome. |
| **Typography** | The product's own: **Bebas Neue** for wordmark and labels, **DM Serif Display** for statements, **Inter** for captions. |
| **Palette** | Night `#050507`, product violet `#7a4dff`, glow peach `#f4a67f`, lilac text `#cfc6f3`. |
| **Image treatment** | The app's own glass-flower and path artwork as dim, cropped environment. Interface shown as *crops* at large scale with annotation lines, not as repeating phone mockups. |
| **Composition** | Gallery: the flower artwork fills the viewport as environment; one large craving-support screen rises from the bottom edge, cropped; a slow breathing ring sits behind it. Title `RECLAIM` runs across the lower third. |
| **Signature interaction** | A breathing orb you can follow: inhale, hold, exhale, hold, four seconds each, labelled. Starts only on click/tap; static under reduced motion. |
| **Narrative rhythm** | One vertical spine, five beats of one evening: *an urge arrives → support is one tap away → a small action → it is recorded → you come back*. Each beat is a real screen or a real recording with a one-line caption. Three decisions fold away. |
| **Gallery transition (in)** | Iris: a circle opens from the breathing orb. Outgoing scene sinks and dims. |

## 02 · WealthWithSG — "The chart is the room"

| | |
|---|---|
| **Central idea** | Noise becomes structure. The chart does not illustrate the title; it is the space the title lives in. |
| **Typography** | **Cormorant Garamond** high-contrast capitals, brass `WITH`; **Inter Tight** for annotations; mono axis labels. |
| **Palette** | Ink `#08090b`, hairline grid, brass `#c8a45c`, hollow green/red candles (always labelled in text). |
| **Image treatment** | No photography. Data-ink only: an original SVG chart. Real captures of the live site appear later as evidence, cropped to details. |
| **Composition** | The chart spans the full viewport and rises behind and through the title. The title's baseline is the price line. |
| **Signature interaction** | Move across the chart (pointer x, finger drag, or the labelled slider) to pull noise into candles and a moving average. Settles on structure by itself. |
| **Narrative rhythm** | Interactive chart → a native-scroll strip of the six real frames → three decisions → compact evidence screens and a status table. |
| **Gallery transition (in)** | A brass time-cursor sweeps left to right, revealing the chart behind it; structure resolves after the cursor passes. |

## 03 · Sankalp & Shristi Furnishers — "Drawn, then built"

| | |
|---|---|
| **Central idea** | Craft starts as measurement. Hairlines become slats, slats become a frame, the frame fills with material and the room arrives. |
| **Typography** | **Fraunces** italic for the title, **Inter Tight** captions. |
| **Palette** | Ivory `#efe8da`, charcoal `#1c1711`, teak/brass `#7a5416`; the render's own warm light. |
| **Image treatment** | The bed render registered exactly to traced geometry from the prototype (`bed-trace.json`, one 1500×1200 space). No website screenshots inside the animation. |
| **Composition** | Architectural verticals run the full height of the viewport; the bed occupies the right two-thirds and bleeds off the edge, lines still resolving across its frame. |
| **Signature interaction** | The transformation: one stable stage, one progress value, driven by scroll with a skip link and a draggable slider. |
| **Narrative rhythm** | Scene → large transformation stage → materials (crops of the making renders) → authentic before/after of the repo's own design pass → configurator evidence → status. |
| **Gallery transition (in)** | Vertical lines widen into the surface (a mask of hairlines opening to full width). |

## 04 · Experiments — "Three questions, three speeds"

| | |
|---|---|
| **Central idea** | Each study asks a different question of motion; the entrance lays them side by side at different scales and speeds. |
| **Typography** | **Instrument Serif** title, **JetBrains Mono** labels. |
| **Palette** | Near-black, bone, the portfolio's signal orange. |
| **Image treatment** | Real previews, cropped hard: a detail of the CyberPunk figure, a slice of the Parallax valley, the GSAP headline. |
| **Composition** | Three tall strips run the full viewport height, each at a different crop and scale, with the title crossing all three. |
| **Signature interaction** | Strips drift at different rates with the pointer (depth, as in the Parallax study). On touch there is no pointer, so they hold still after a staggered entrance. |
| **Narrative rhythm** | Three full-width study bands, one question each, a line of what it taught, links, and a click-to-load live preview. |
| **Gallery transition (in)** | The three strips slide in from different directions on staggered delays. |

## 04 · Aureledger — "A note becomes lines" (updated for the wallet redesign)

The first version of this exhibition used the product's earlier receipt-and-atlas introduction. Aureledger has since been redesigned (leather wallet, a banknote traced into contour lines, one-scale graph), so this exhibition was rebuilt from the new work.

| | |
|---|---|
| **Central idea** | Money arriving as paper, then read as lines. The product's own introduction is the exhibit: a wallet opens, a note leaves its sleeve, the note's engraving becomes contour lines, and the lines become a graph. |
| **Typography** | The product's own: **Instrument Serif** (title and statements), **Hanken Grotesk** (text), **IBM Plex Mono** (labels). |
| **Palette** | The product's own tokens: espresso `#191410`, ivory `#efe4d2`, leather `#30261e`, one ember `#ff985f`. |
| **Image treatment** | Real captures of the live introduction. The gallery scene uses two clean frames of the note (canvas only, no interface text) that share one crop box. Staged captures redact issuer names (see ASSETS-NEEDED). |
| **Composition** | Gallery: the note bleeds off the right edge on espresso; the left half of it is drawn as lines, with an ember divider at the split. Title on the left. |
| **Signature interaction** | Two, one per surface. In the hero, move across the note (or use the labelled Paper/Lines control) to draw the lines over the paper. On the page, scrub the whole introduction: a pinned stage driven by native scroll, with a seven-chapter rail and a slider that move the scroll position, so there is only one source of progress. |
| **Narrative rhythm** | Scrubbed introduction (seven chapters, each captioned from the product's own briefing copy) → "Does it count as spending?" quiz built from the app's accounting rules → three decisions → plain status. |
| **Gallery transition (in)** | The wallet opens along its fold: the slide is revealed outward from the centre line, then the note unfolds. |
| **Position in the gallery** | Fourth, after the three exhibitions that are websites and apps with human-facing interfaces and before the archive. It is the most recent substantial piece of work and the one with the strongest visual identity, so it sits near the end, ahead of the experiments that it grew out of. |
| **Fallbacks** | Reduced motion and no JavaScript get seven fixed stages instead of the pinned stage; the note rests at its midpoint. Phones get portrait captures. Frames are fetched only when the section approaches. |

---

## Pacing rules applied to every page

- One central question per exhibition, shown near the top.
- About three decisions, collapsed into disclosures with one-line summaries.
- Evidence first: screens, crops, recordings, before/after, process artifacts. Captions beside the image, one line.
- Status and qualifiers (prototype, sample data, studio renders, health and finance caveats) appear once, compactly, near the material they qualify.
- No repeated "premise / challenge / concept / decisions / reflection" prose.
