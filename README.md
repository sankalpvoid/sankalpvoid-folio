# sankalpvoid-folio

Portfolio of **Sankalp Kushwaha** (sankalpvoid), redesigned as a gallery: each project is an exhibition with its own art direction.

Static site, no build step, no runtime dependencies. Fonts come from Google Fonts. The only JavaScript is first-party and progressive: every page works with JavaScript off.

## Routes

| Route | What it is |
|---|---|
| `/` | Gallery entrance: four featured exhibitions, one at a time. Deep link with `/#wealthwithsg` etc. |
| `/projects/` | Compact "All projects" overview (also opens as an overlay from any page) |
| `/work/reclaim/` | Exhibition 01: Reclaim |
| `/work/wealthwithsg/` | Exhibition 02: WealthWithSG |
| `/work/sankalp-shristi-furnishers/` | Exhibition 03: Sankalp & Shristi Furnishers |
| `/work/aureledger/` | Exhibition 04: Aureledger |
| `/archive/` | Exhibition 05: Experiments (CyberPunk, Parallax, GSAP Motion) |
| `/about/`, `/contact/` | About (with music) and contact |

## Run locally

```sh
python3 -m http.server 4173
# open http://localhost:4173
```

Any static server works. Use trailing-slash URLs (`/about/`), as Vercel does with the included `vercel.json`.

## Checks

The browser checks live in `scripts/` with their own `package.json`, so they never affect the deployed site.

```sh
cd scripts && npm install && npx playwright install chromium
# in another terminal, serve the site on :4173 (see above), then:
npm run verify   # routes × 3 viewports, console/network errors, overflow, images, keyboard, back/forward, reduced motion, no-JS, links
npm run axe      # axe-core WCAG A/AA + best-practice on every route at 1440px and 390px
```

## Structure

```
index.html            gallery entrance
projects/ about/ contact/ archive/ work/<slug>/index.html
assets/css/           base.css (tokens, motion system, chrome, overlay), scenes.css (the four full-viewport scenes shared by gallery and project heroes), one stylesheet per exhibition
assets/js/            site.js (shared), scenes.js (SVG chart + traced-bed builders), home.js, one small script per exhibition
assets/data/          bed-trace.json: traced bed geometry from the Furnishers hero prototype
assets/img/           real media only: prototype captures, studio renders, experiment previews
docs/DESIGN.md        creative direction, motion system, decisions
docs/ART-DIRECTION.md per-exhibition art-direction spec (second pass)
docs/ASSETS-NEEDED.md missing assets and facts to confirm
docs/screenshots/     reference screenshots
```

## Baseline

The previous single-page site is preserved on `main` and tagged `baseline-pre-redesign`.
