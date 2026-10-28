# Music on the site

## What exists

- A **Side B** section on the Profile page (`/profile/#music`). The line that runs through the Profile type (a straight line that becomes a string, then a waveform) is a drawing, not an audio meter.
- Links to the two verified channels: YouTube `@sankalp.mussic` (https://www.youtube.com/@sankalp.mussic) and Instagram `@sankalp.singss` (https://www.instagram.com/sankalp.singss/). Both were taken from the earlier portfolio, which is in git history at the tag `baseline-pre-redesign`, and both responded with HTTP 200 when checked.
- A decorative line/waveform, `aria-hidden`; it is drawn by scroll position, not by sound, because nothing is playing.
- **No recordings.** The repositories contain no audio files, so the site has no player, no waveform that responds to sound, and nothing that autoplays.

## Recordings still needed

If you want a recording on the site, provide one or a few pieces you have the right to publish, with: title, what it is (cover or original), who performed and produced it, and a source file (MP3 or M4A, ideally under 5 MB per piece) plus a short plain-text description for each.

## How a recording will be added

In `profile/index.html` there is a comment marking the slot inside `#music`. Replace it with a labelled card:

```html
<figure class="track">
  <figcaption><span class="mono">Cover · vocals and guitar</span><b>Title</b></figcaption>
  <audio controls preload="none" src="/assets/audio/title.m4a"></audio>
</figure>
```

Rules that apply:
- `preload="none"` and no `autoplay`. Playback is always user-initiated.
- Use native controls (keyboard and screen-reader accessible), a visible title, and an accurate label for what the piece is.
- `assets/js/site.js` pauses any playing media when the page is hidden. If more than one piece is added, also pause the others when one starts.
- A waveform may respond to real playback only if the Web Audio API is connected to that element. Otherwise keep the static decoration.
- Do not attach sound effects to navigation.
