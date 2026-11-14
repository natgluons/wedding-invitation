# Vowfable maker's note — full HTML + added assets

Compared with the exact original `index.html` on [`natgluons/wedding-invitation`](https://github.com/natgluons/wedding-invitation), `main` branch, 14 November 2026. Verified original Git blob SHA: `d7927588e93e4e6a8eaaa3812795c4f40f26ec46`.

## What's inside

- **`index-full-with-vowfable.html`** — **complete updated HTML of your original wedding invitation** (not just the new section). It retains your cover, couple, ceremony, timeline, RSVP, gifts, wishes, Thank You, and existing scripts; only the stylesheet/script references and new outro after `</footer>` were added.
- **`vowfable-outro.html`** — just the new section's complete editable HTML.
- **`vowfable-outro.css`** — scoped responsive styling.
- **`vowfable-outro.js`** — bilingual EN/ID switch handling; does not edit existing `main.js`.
- **`assets/vowfable/*.svg`** — original, newly designed seal, wave pattern, floral ornament.
- **`index.html`** — desktop/mobile standalone demonstration with referenced files.
- **`standalone-preview.html`** — single HTML file with all visual assets embedded for offline opening.
- **`assets/vowfable/preview-photo.webp`** — design mockup picture (preview only); the real invitation uses `assets/photos/placeholder-6.jpeg` in your existing repo.
- **`apply_vowfable.py`** — optional installer to patch your original local clone and add all files without manual merging. Idempotent.

## Option A — copy the ready full HTML

1. Make a backup of your repository's current `index.html`.
2. Copy `index-full-with-vowfable.html` as `index.html` in the root of your existing repo.
3. Copy `vowfable-outro.css` and `vowfable-outro.js` to the repo root, and the three SVGs to `assets/vowfable/`.
4. In `index.html`, replace **`https://vowfable.arpicato.com/`** with your real business website URL.
5. Keep existing `main.js`, `styles.css`, `desktop.css`, your original photos and scripts intact. This package only includes *new* assets, not duplicates of existing assets.

## Option B — automatically apply to your CURRENT original code (safer if repo has changed)

```bash
python3 /path/to/vowfable-outro-delivery/apply_vowfable.py /path/to/wedding-invitation --url https://your-real-vowfable-site.example/
```

Windows:

```powershell
py C:\path\to\vowfable-outro-delivery\apply_vowfable.py C:\path\to\wedding-invitation --url https://your-real-vowfable-site.example/
```

The installer edits only `index.html`, adds two new root files and three SVGs, and keeps existing `main.js`, RSVP, wish, config and backend untouched. Language switch works through `vowfable-outro.js` watching the existing document language attribute.

## Design and delivery notes

- Matches the original wedding site's burgundy, gold, warm parchment, soft blossoms, wave motifs and polaroid-style photos.
- New section appears **after** the closing “Thank You” photograph and contains **no numeric prices**.
- Existing photo asset `assets/photos/placeholder-6.jpeg` is reused. Photo in standalone demonstration is a conceptual crop, not a replacement for your real photo.
- The Vowfable URL is **deliberately a placeholder** until you provide your domain. Do not publish without changing it.
- Since the repository may change, **Option B** is safest; Option A corresponds exactly to the GitHub `main` index inspected on 14 November 2026.
- I did not push any changes to your GitHub repository.
