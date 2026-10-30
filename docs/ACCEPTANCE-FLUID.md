# Acceptance checklist: fluid cinematic refinement

Status: **implemented** (built, not independently verified) / **verified** (automated check run, evidence named) / **limited** (partly done, see note).
Automated results below are for code commit `3911398` (local, Chromium/Firefox/WebKit 313/312/312 pass, 0 fail) and its public Preview `sankalpvoid-folio-6c3pi9thl-sankalpvoid.vercel.app` (same suite, same results, no cookies or share token). axe-core: 0 violation groups on all routes, story scenes, gallery slides, index states and overlays. No physical Safari, phone, screen-reader or measured frame-rate testing was done.

| # | Requirement | Status | Evidence / note |
|---|---|---|---|
| 1 | Gallery declutter (ticks, triangle, labels, duplicate list, hints, bottom All-projects; arrows + counter kept) | verified | verify.js "gallery: ticks, corner handle, duplicate collection..." and "one composed viewport"; no-JS route via header link and `<noscript>` link |
| 1b | Project pages declutter (no long chapter strip, counters, resting next name) | verified | rail checks per project; chapters live in a rail popover |
| 2 | Typography system | limited | Playfair Display + Inter Tight replace eight families; the reference's Tusker Grotesk / Suisse Intl / RL Unno are proprietary and not used (docs/FLUID-DIRECTION.md). Line breaks reviewed at 390/768/1280/1440 for gallery titles; story headings reviewed at 1440 only after the swap |
| 3 | Title pointer response | limited | Gallery titles only (title-fx.js, elastic lean + variable weight, aria-safe). Index titles do not respond |
| 4 | Fluid entry (hold lens, early release, expand) | verified (Chromium+SwiftShader), limited elsewhere | hold/cancel/complete tests in all engines; WebGL path inspected in Chromium frames only; Firefox/WebKit runs may use the CSS fallback surface |
| 4b | Gesture semantics (title/Enter/hold = current; arrows select; rail Next = next) | verified | gallery and rail tests |
| 5 | Continuous route transitions | verified (arrival overlay, bounded prepare, back/forward, no stuck overlay); limited for "no flash" | sampled frames show rest → bulge → zoom → arrival → settle with no black frame; not measured per frame on hardware |
| 6 | Simplified rail | verified | rail quiet check, bottom bar on phones, scrollbar lane kept |
| 7 | Recompose all six stories | limited | Not repeated this pass. Stories keep the previous pass's scene structure; this pass changed type, rail, footers, closing panels and the Kaal crow scene. Further art direction of Reclaim (10 scenes) and Experiments remains |
| 8 | Weighted scrolling | verified | unchanged single-owner engine; pace, burst, reversal and chapter-jump tests |
| 9 | Archive fluid field | verified / limited | fixed title, press lens, layers, tilt, inertia, bounds, reduced motion tests; "globe-like" feel is lens + tilt, not a seamless spherical field |
| 10 | Project index outline/neutral | verified | idle, hover, focus, rest, rapid switching, overlay, touch Open tests |
| 11 | Kaal crow | verified (behaviour) / limited (art tuning) | idle, attentive, click→strip, three clicks→flight, return, pause offscreen, reduced motion; strip timings follow the app's tables |
| 12 | Profile | verified | zero-width start, scenes, no orange, new email; copy unchanged and still awaiting the owner's review |
| 13 | Email | verified | old address absent from every route; contact + profile use sankalp.direct@gmail.com |
| 14 | Misc | verified / limited | footers compacted, footer removed from the gallery; fonts load from Google Fonts (one request pair); no image-size audit |
| V | Test suite updated for the new design | verified | scripts/verify.js, scripts/axe.js, scripts/capture-fluid.js |
| D | Public Preview, READY for the pushed SHA, anonymous access | verified | see the delivery report |
