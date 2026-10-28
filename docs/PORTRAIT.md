# Portrait: where the photo goes

Today the Profile page shows an **illustrative sketch** (an abstract head-and-shoulders outline inside contour lines, with a small orbit). It does not depict anyone's face. When a real photograph is ready, it replaces the sketch with no layout change.

## To add the photo

1. Export the photograph and save it as `assets/img/portrait/portrait.jpg` (create the folder if it is missing).
2. In `profile/index.html`, set the `data-photo` attribute on `.pf__portrait` (it is empty now):

   ```html
   <figure class="portrait" data-portrait data-photo="/assets/img/portrait/portrait.jpg">
   ```
3. Commit and push. Nothing else changes: no URLs, no script edits.

The `alt` text on `.portrait__photo` already reads "Sankalp Kushwaha". Adjust it if you prefer a description of the image.

## Dimensions and crop

- **Aspect ratio 4:5 (portrait).** Both pages use the same frame.
- **Size:** at least 1200 × 1500 px; 1600 × 2000 px is better for large screens. JPEG, around 200–300 KB, or WebP.
- **Framing:** head and shoulders, with the face in the upper-middle. The image is positioned `50% 22%`, so leave headroom above the head and let the shoulders run off the bottom edge.
- **Background:** a plain or softly out-of-focus ground reads best against the bone-coloured page. The sketch fades behind it to 90% opacity.
- Optional second size: a 1000 px-wide version for phones. If you add one, use `srcset` on `.portrait__photo` in both pages.

## What the effect does

- **Pointer devices:** the photograph is drawn in from the left once (about 1.6 s) over the sketch. Afterwards, moving the pointer across the frame slides the reveal edge, and leaving the frame completes the photograph.
- **Touch devices:** the draw-in plays once; there is no hover behaviour to replace.
- **Reduced motion:** no draw-in and no pointer reveal. The photograph appears at once, fully shown.
- **No JavaScript:** the sketch stays, because the photograph is loaded by script. The page is still complete.
- **Missing or failed photo:** if the file is absent or does not load, the sketch simply remains. Nothing is shown as broken.

## Files involved

| File | Role |
|---|---|
| `assets/img/portrait/portrait.jpg` | the photograph (to be added) |
| `profile/index.html` | the `.pf__portrait` element and its `data-photo` attribute |
| `assets/css/portrait.css` | frame, sketch drawing, photo reveal |
| `assets/js/portrait.js` | pointer response, orbit dot, photo loading and reveal |

The sketch SVG can be left in place: it remains behind the photograph while the reveal runs.
