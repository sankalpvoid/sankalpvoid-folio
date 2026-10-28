# Assets still needed, and things to confirm

## Missing assets (nothing was invented to cover these)

- **Music.** No audio or video of a performance was available in any repository, so the site has no embedded audio (and never autoplays). About links to the YouTube and Instagram channels. To add a listening moment: pick one recording you own, then add a click-to-load embed or a self-hosted `<audio controls preload="none">` to `about/index.html`.
- **A portrait or studio photo** for About.
- **Real photography** for Sankalp & Shristi Furnishers: showroom, workshop, products. Until then the site uses the repo's own studio renders, each labelled placeholder.
- **Reclaim:** the craving flow (support, box breathing, feedback, confirmation, later recommendation) was captured from the local prototype with sample data and backend requests blocked, so sign-in and Supabase sync are not shown. Not captured: the Reduce and Track journeys, insights and circles. The recording is WebM, which older Safari versions may not play; a poster image is shown instead.
- **WealthWithSG:** real lessons, articles and verified social links come from the brand owner.

## Facts and wording to confirm before publishing

1. **Ownership and roles.** The pages say "concept, design and build" for WealthWithSG and Furnishers and "designed and built" for Reclaim, from the READMEs. The WealthWithSG commit history shows Claude as co-author; decide whether to mention AI assistance. WealthWithSG is described as a concept for Shailesh Gour's brand; no client approval is claimed. Confirm both are accurate and that the Furnishers business may be named.
2. **Furnishers status.** The page says "demonstration build, not the showroom's live site" (the prototype itself says so). The prototype link is a Vercel preview URL (`...git-claude-hero-p-2877d3...`); replace it with a stable URL if you promote it.
3. **Decision and lesson wording.** "Decisions", "consequences" and "what I learned" text is written from the Reclaim, WealthWithSG, Furnishers and experiment READMEs. Edit anything that doesn't sound like you or isn't how you'd put it.
4. **About copy.** Facts come from the previous site (IIT Bombay, Environmental Sciences & Engineering, Mumbai, current focus areas). Two sentences of voice are new ("a song and an interface both live or die on timing"). Edit or remove.
5. **Experiment imagery.** CyberPunk uses 3D character frames, the Parallax scene uses stock photography (Unsplash-named files in the repo) and the GSAP page shows a demo brand. I describe them as demo material and don't claim the imagery as yours; confirm sources and licences.

## Product issues noticed while capturing Reclaim

- Light theme, Craving Support: the three coping-tool cards render with very low text contrast over their artwork. The site shows the dark version of that screen.

## Provenance to confirm (second pass)

- **Furnishers bed lines.** `assets/data/bed-trace.json` is the traced geometry from your hero prototype (`claude/hero-prototype`, `src/app/(site)/lab/hero/bed-trace.json`, room contours removed). It only fits that studio render. The before/after images are the repository's own `docs/design/before` and `after` captures.
- **Reclaim artwork.** The flower and path images are the app's own assets from the local Reclaim repo.
- **"Worked for you before".** The page describes it as a plain rule (three rated cravings, a tool used at least twice with a positive feedback score, best average first). I read this from `cravingRecommendation()` in the app; confirm it is still how the live build behaves.
- **Reclaim sample data.** The "Sample" profile, 14-day run and four seeded cravings are test data I created for the captures, labelled as sample on the page.

## Aureledger (rebuilt for the wallet redesign)

- **Sources.** The product facts come from the repository's `main`: `docs/RELEASE_REPORT.md` (26 Oct), `docs/INTRO_BRIEFING.md`, `docs/MOTION.md`, `src/lib/theme.ts` and the README. Imagery is captured from the public site at https://aureledger.vercel.app with example data only. Nothing from a signed-in workspace appears.
- **Redaction.** The example data names real banks and a card issuer in small text (for example in the balance line and on the cards). The captures were taken with those names replaced by "Bank" so the portfolio doesn't publish which accounts you use. The live site itself still shows them. The same redaction is applied to the scrub frames, so a frame may differ in wording from the live page.
- **What the images are.** 32 desktop and 10 phone frames captured at set scroll positions, plus two clean canvas-only frames of the note. They are stills, not a recording and not the live scene. The live introduction uses Three.js and is not embedded.
- **Status wording to confirm.** The page quotes the 26 Oct release report: 170 tests, identical frames scrolling forward and in reverse, static versions for reduced motion / WebGL off / JavaScript off, and not tested: real GPU, Safari, Firefox, phones, screen readers, and Google sign-in with Gmail sync end to end. Later commits (sign-in error handling, parsers for observed alert layouts, a personal briefing for signed-in users) suggest real use since then. Please confirm or update the "Not verified" sentence.
- **Role.** "Concept, design and build" is my wording. Confirm it, and decide whether to mention AI assistance.
- **No source link.** The repository is private. The live-site links are the public introduction and the synthetic demo.
- **Quiz amounts** (₹1,200, ₹12,000, ₹20,000) are illustrative. The SIP 5,000 / 4,999.75 example is the repository's own.
- **Missing.** A screen recording of the introduction would show the 3-D wallet motion that stills can't. The cards and workspace frames are shown as stills of an example.
