# Completed refinement follow-through

Base: `0c166b553c6c0ff31d5d05142ba3f188b647d0c6`, on `feature/cinematic-profile-archive`.
The Reclaim gallery remains the root. Production and the rejected homepage branch are outside this change.

## Fixes and evidence

- WebKit selection: story descendants no longer override display selection with `user-select:text`; native `selectstart` and media ghost drags are cancelled, with residual display ranges cleared on release. Editable fields and explicit `.sel` copy areas keep their defaults.
- Rail after content drag: the missing movement was reproduced at the outer 12px of the rail but not its centre. WebKit's visible overlay scrollbar owns that outer lane. A 16px desktop gutter reserves the native scrollbar area; the rail, header and story geometry reserve the same space. The reload workaround is removed from the suite. The test still presses the original near-corner position.
- Archive settling: coasting velocity is cleared below its stop threshold; the final subpixel position and rendered velocity snap together, with tilt exactly zero and rotational transforms removed.
- Firefox recenter: a release outside the window could leave capture attached to the archive view. The next button received `pointerdown`, but `pointerup`/`click` were retargeted to the view. Capture is now explicitly released, including inferred releases and an outside-control press.
- WealthWithSG: removed the leftover duplicate six-frame screenshot strip, its duplicate `c-frames`/`w1` IDs and identically named landmark. The three full-bleed frames and the curated explanation remain.
- Flat stories: desktop inline `vw` column widths no longer leave very narrow copy columns on phones/tablets, reduced-motion pages, or no-JS pages.
- Index: improved small labels and background scrim contrast.

## Verification tooling

`cd scripts && npm ci`, then serve the repository using:

```sh
python3 -m http.server 4195 --bind 127.0.0.1
```

Use the exact IPv4 origin for this checkout. Another listener on IPv6 `localhost:4195` served the previous files during investigation; runs against that listener are not evidence for this revision.

```sh
ENGINE=chromium node scripts/verify.js
ENGINE=firefox node scripts/verify.js
ENGINE=webkit node scripts/verify.js
node scripts/axe.js
```

The suites now fail their process on failed assertions, report progress, handle Firefox's `/about/` redirect without dereferencing a null document response, and use bounded state waits for animation rest. Always-true assertions were removed. The rail is tested immediately after a content drag, without reloading.

For a protected Preview, set `BASE` to its unique deployment origin and `SHARE_QS` to an authorized temporary share query. Do not commit the share token or change project protection.

`capture-refinement.js` captures every story scene at 390/768/1440 CSS pixels, before/after views against a separately served `9efac04` snapshot, and six interaction recordings. `OUT`, `BASE`, `BEFORE`, `SHOTS_ONLY`, and `VIDEOS_ONLY` configure evidence generation. Captures are review artifacts, not production assets.

## Limitations and owner review

Automated WebKit is not physical Safari verification. No physical phone, hardware-GPU benchmark, or screen-reader session is claimed. Touch dragging is Chromium CDP emulation. Automated axe checks do not certify overall accessibility.

The existing Profile wording remains for owner confirmation: the engineering/building lines, the connection between disciplines, and “A song and an interface both depend on timing.” No new first-person claims were added. Music remains channel links; no recording was invented. The supplied portrait assets remain unchanged.

## Local results (29 October 2026)

- Chromium: 252 pass, 0 fail, 0 skip.
- Firefox: 251 pass, 0 fail, 1 skip (Chromium CDP touch drag).
- WebKit: 251 pass, 0 fail, 1 skip (Chromium CDP touch drag).
- axe-core: 0 groups with violations after the index-label contrast correction; routes at 390/1440, each desktop story scene, Profile states, archive list and project-index overlays.
- Visual evidence: every scene from all five projects at 390/768/1440, comparison captures against `9efac04`, and six WebM recordings. Phone/tablet copy columns were corrected after visual inspection.

Deployment-specific results belong in the delivered review report; the local results above do not imply deployed verification.

Protected-deployment harness follow-up: share queries are inserted before URL fragments (so `#archive` stays intact), and `/about/` verifies Profile with an actual destination request even when Firefox reports a cached 304 during Vercel's redirect. Neither issue changes the application itself.
