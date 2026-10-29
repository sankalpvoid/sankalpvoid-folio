# Kaal exhibition

Source reviewed: private `sankalpvoid/Kaal`, main commit `500a711f23229b46d09092e67d7b1055e631936b` (package version 3.1.0). The repository remains private; no source files, personal records, binaries or credentials are published by this exhibition.

## Story evidence

- Ambient crow, deliberate summons, focus threshold: `src/core/presence/{manifestation,transform,focus}.ts`, `src/main/presence.ts`, `docs/presence.md` and `docs/v3.md`.
- Observatory's Said / Remembered / Noticed / Thinks / Recommends vocabulary: `src/renderer/observatory/voice.tsx`, `docs/observatory.md`.
- Deterministic foundation and optional local model: `src/intelligence/ollama.ts` (loopback restriction), `docs/local-intelligence.md`. No blanket offline/no-network claim is made; optional voice/services have their own boundaries.
- Voice starts through deliberate hold: `docs/voice-interaction.md`, `src/core/voice/ptt.ts`. The portfolio never accesses a microphone.
- Silence neutral and corrections/forgetting: `docs/relationship.md`, `docs/observatory.md`, corresponding Observatory components. These describe the code/design, not an independent security certification.

## Public assets

Optimized derivatives of the project's existing `assets/reference/control-centre-art/{about-crow-orbit,home-crow-dusk,memory-archive-tree}.png`. These are labelled project artwork, not app screenshots. `crow-sheet.png` is the real runtime sprite sheet from `src/renderer/avatar/crow/crow_sheet.png`; preview cells use the mappings in `src/core/crow/sheet.ts` (idle 0, listening 4, attentive 5).

The three-state stage is an editorial preview with no audio, backend or desktop bridge. It does not simulate a working Kaal installation. The page makes no public-download or public-source promise and links to Contact instead. The hero/index image is captured from the shared Kaal scene.

Order: Reclaim, WealthWithSG, Furnishers, Aureledger, Kaal, Experiments. The root remains Reclaim. No portrait/music wording changes were made.

## Integration correction

Visual testing of the hero's Presence link found native hash scrolling moving the hidden-overflow story pin horizontally as well as the story transform. `story.js` now clears that native horizontal offset on chapter hash changes and focus. The regression asserts that the target chapter actually sits inside the visible viewport, with `pin.scrollLeft === 0`, in all three engines.
