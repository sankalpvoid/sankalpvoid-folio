# Reference notes (edoardosmerilli.com)

Inspected in a real browser (Chromium, 1440×900) alongside the eight screenshots. Nothing here is copied; these are the interaction principles I adapted.

| Reference behaviour | Observed how | Adaptation |
|---|---|---|
| **Profile** opens on small tracked caps, a tiny name, and a giant serif word sliding up across a dark field; a portrait emerges beneath it as the word moves on | wheel input, 10+ frames | My Profile opens with my name and the anchor statement as oversized type on one plane while a replaceable portrait study is cropped to a slit and widens as you scroll. Type and portrait move at different speeds. |
| Condensed uppercase statement advances line by line, with indents shifting phrase to phrase | wheel input | Phrase-by-phrase narrative: one large phrase at a time, the previous one dimmed and lifted, each tied to a real project. |
| A radial figure and dates mark a timeline beat | wheel input | Replaced by a single string-to-waveform line that carries the music beat. Decorative only. |
| **Scrolling** | The document is `overflow:hidden`; motion is driven by wheel events, not document scroll | **Deliberately different.** I use real document scroll (sticky stages and a scroll-driven transform), so scrollbars, keyboard, anchors and back/forward keep working. |
| **Archive** is a large `main.grid` with a translate transform, numbered items, a centred title and an "All projects" corner control | drag with the mouse, 3 frames | A bounded canvas of real project images with pointer drag, inertia, a 6 px click-versus-drag threshold, a recentre control and a list alternative. |
| **All projects** shows a stack of large titles, outline for inactive and solid for the hovered one, over a full-bleed image of that project | screenshots 5–6 | A full-screen dialog of titles over a cross-fading full-viewport still of the project, driven by hover and keyboard focus, with a tap-to-preview model on touch. |
| **Hold / unroll** on a project preview | screenshot 7; I could not drive it in the live site (the control did not respond to scripted input) | Specified from the screenshot and your brief: a handle you press and drag, the next page's image revealed behind a travelling fold edge, spring-back below a threshold, completion above it. |
| **Horizontal project story** | screenshot 8 only. I could not open a project page in the live site by script | Built to your spec: document scroll drives a horizontal track, travel = track width − viewport width. |

Not inspected live: the hold/unroll gesture and the horizontal story. Those follow your written requirements and screenshots 7–8.
