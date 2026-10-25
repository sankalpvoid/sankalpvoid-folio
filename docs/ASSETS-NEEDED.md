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

## Aureledger (added after pass 2)

- **Sources.** Facts come from the local repo's README, `docs/MOTION.md`, `docs/VERIFICATION.md` and `docs/SECURITY.md`. Screens are captures of the public landing intro at https://aureledger.vercel.app (synthetic data only). The private workspace, real mail and real figures are not shown.
- **Banks and card names.** The page says "bank, card and SIP alerts" and never names the issuers, to avoid publishing which accounts you use. The live demo itself does name them in small text (for example in its Wealth and Cards views). Those views are not used here.
- **Status wording.** "71 tests at the last verification report" and the deployed concurrency result come from `docs/VERIFICATION.md`. Re-check the figure after the recent atlas and workspace commits. The repo also has uncommitted changes and sits one commit behind its remote, so the live site may not match the latest local code.
- **Not verified, as in the repo's own report.** Gmail has only run against a simulated API; nothing has been imported from a real mailbox; Safari, Firefox and physical phones were not tested. If that has changed, update the Status section.
- **Role.** The page says "Concept, design and build". Confirm, and decide whether to mention AI assistance.
- **Source link.** The repository is private, so there is no "View source" action. The live-site links are the landing page and the synthetic demo.
- **Quiz amounts** (₹1,200, ₹12,000, ₹20,000) are illustrative. The SIP 5,000 / 4,999.75 example is the repo's own.
