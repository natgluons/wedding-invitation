# Hanfu Letter Invitation: Agent-Ready Asset Kit

**Purpose:** A composable, mobile-first digital wedding invitation inspired by a Chinese historical-romance drama and the act of opening a personal letter. Decorative assets are supplied independently so your coding agent can make actual UI with editable copy and interactions. **These are not screenshots cut into buttons.**

## Quick start

Open `index.html` in a browser (or serve the repo root with any static server). Tap the wax seal / **Open the letter** button. The envelope has a separately animated flap, front pocket, emerging letter, wax seal, and tassel. The invitation then shows a couple hero, event details, story, RSVP, gift details and closing. The background song starts when the letter is opened, and the note button in the bottom-right pauses or resumes it.

For best results, from the repo root run: `python -m http.server 8000` and open `http://localhost:8000/`.

## Current invitation

- **Couple:** Richard Putra, S.Kom. & Kristy Natasha Yohanes, S.Si., M.Sc. (shown as **Richard & Natasha**)
- **Date:** Sunday, 17 January 2027, 18:00 WIB – finish
- **Venue:** Grand Mercure Magnolia Ballroom, Jakarta
- **RSVP deadline:** 17 December 2026
- **Story:** first met April 2021; first date 1 June 2023 at Mall Kelapa Gading (MKG); engaged 2 June 2025; long-distance while Natasha studies abroad at Imperial College London; wedding day 17 January 2027.

The countdown in `main.js` is set to `2027-01-17T18:00:00+07:00`.

### Personalised invitation links

Add a guest name to the URL to personalise the cover and pre-fill the RSVP:

- `/alice` → cover shows **Dear Alice & Guest,** the envelope says **For Alice**, RSVP pre-filled with 2 seats.
- `/alice?plus=0` → 1 seat and **Dear Alice,**
- `/alice?guests=3` → 3 seats and **Dear Alice & Guests,**
- `?name=John` or `?to=John` also work, with the same `plus` / `guests` options.

Path links (`/alice`) keep the URL clean. They need a host that serves `index.html` for unknown paths: `_redirects` covers Netlify, and `404.html` makes GitHub Pages forward `/alice` to `index.html?name=alice`. On GitHub Pages the address changes after the forward, though the invitation still greets Alice.

The greeting and seat note are set with `textContent`, so names from the URL cannot inject HTML.

### Generating one link per guest

Put your guest list in `guests.csv` (copy `guests.example.csv`):

```csv
name,seats
John Tan,2
Alice Wijaya,1
The Wong Family,4
```

Then run:

```powershell
node tools/generate-links.js --base https://yourname.github.io/wedding-invitation/
```

The base URL defaults to `siteUrl` in `config.js`. The script writes:

- `guest-links.csv`: guest name, seats, and full link (opens cleanly in Excel/Sheets)
- `guest-links.html`: a preview table with a copy button per guest, handy for WhatsApp

Duplicate names are skipped, names with commas/quotes/`&` are encoded correctly, and seat counts are clamped to the 1–6 options in the RSVP form.

## RSVP backend (Google Sheets)

The form in `index.html` posts to a Google Apps Script Web App which appends each response to a Google Sheet. Nothing is sent until you complete this setup.

1. Create a new Google Sheet and copy the long ID from its URL:
   `https://docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit`
2. Open <https://script.google.com> → **New project**, replace the default code with `rsvp-backend/Code.gs`.
3. Paste the sheet ID into `const SHEET_ID = '...'` at the top of `Code.gs`.
4. Run the `setup` function once (choose the function in the toolbar → **Run**) and approve the permission prompt. This creates the `RSVP` tab and its headers.
5. **Deploy → New deployment → Web app**:
   - Description: `RSVP`
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Copy the deployment URL that ends in `/exec` and paste it into `rsvpEndpoint` in `config.js`:

```js
window.WEDDING_CONFIG = {
  rsvpEndpoint: 'https://script.google.com/macros/s/AKfy.../exec',
  siteUrl: 'https://yourname.github.io/wedding-invitation/',
  contactWhatsApp: '6281234567890'
};
```

The sheet records: submitted time (Asia/Jakarta), name, attendance, guest count, message, the name from the personalised link, and the page URL. A guest who submits again updates their existing row instead of creating a duplicate.

If the request fails, the form offers a WhatsApp fallback when `contactWhatsApp` is set. If `rsvpEndpoint` is blank the form stays in preview mode and tells you so.

Because Apps Script does not answer CORS preflight requests, `main.js` sends the body as `text/plain` (a "simple" request) and retries with `mode: 'no-cors'` if needed. The sheet is the source of truth; do not expect the browser to read a JSON response in every case.

## Guestbook (Words of Love)

The **Words of Love** section above the closing screen lets guests leave a wish. Wishes are stored in the `Wishes` tab of the same Google Sheet and shown back in the invitation, newest first.

- A wish is sent with the same `rsvpEndpoint`; no extra configuration is needed.
- Apps Script cannot return CORS headers reliably, so the page reads wishes with JSONP (`?action=wishes&callback=...`). The backend supports this automatically.
- To remove an inappropriate wish, delete its row in the `Wishes` tab.
- Before the backend is connected, wishes are saved in the guest's browser only and a notice explains that. This makes the section testable without a backend.
- If you change `Code.gs`, update the deployment: **Manage deployments → edit the existing deployment → Version: New version → Deploy**.

## Folder layout

- `index.html`, `styles.css`, `main.js`: the working invitation
- `404.html`: forwards pretty links such as `/alice` on GitHub Pages
- `_redirects`: pretty links on Netlify
- `config.js`: RSVP endpoint, published site URL, WhatsApp fallback
- `rsvp-backend/Code.gs`: Google Apps Script backend for the RSVP sheet
- `tools/generate-links.js`: builds personalised links from a guest CSV
- `guests.example.csv`: guest list template (`name,seats`)
- `assets/svg/`: source assets in editable, resolution-independent SVG (22 files)
- `assets/png/`: exported PNG variants for common decorative layers (15 files)
- `assets/photos/demo-hanfu-couple.jpg`: **AI-generated sample photo**, cropped from our earlier mockup, **not the couple's actual photograph**
- `assets/bgsong/a-heartbeats-turn.mp3`: background music, starts when the letter is opened
- `references/design-reference.png`: earlier generated visual design reference; **not intended as a directly usable interface**
- `design-tokens.json`: colors, spacing, motion and typography values
- `asset-manifest.json`: semantic purpose and size of each asset

## Asset roles

| Asset | Role |
| --- | --- |
| `bg-cover.svg` | Decorative parchment, blossoms, mountains for opening/ending |
| `bg-letter.svg` | Readable parchment for letter and event details |
| `bg-rsvp.svg` | Clean texture for RSVP screen |
| `paper-texture.svg` | Universal soft parchment background |
| `envelope-back.svg` | Stationary envelope base (behind paper) |
| `envelope-front.svg` | Pocket/side folds (in front of paper) |
| `envelope-flap.svg` | Animate `rotateX(179deg)` from top hinge |
| `letter-paper.svg` | Revealed sheet, leaving all letter text in HTML |
| `wax-seal.svg` | Individual seal with a vector 囍; fade / shrink on open |
| `double-happiness.svg` | Vector 囍 mark used by the header and closing seal |
| `red-tassel.svg` | Optional hanging tassel on cover |
| `blossom-branch-left/right.svg` | Optional transparent foreground layers |
| `pavilion-landscape.svg` | Transparent mountain landscape footer |
| `corner-ornament.svg` | Scalable corner motif |
| `cloud-divider.svg` | Divider graphic for headings |
| `portrait-frame.svg` | Transparent overlay for user-supplied photos |
| `petal-01..04.svg` | Four alpha-transparent petal assets for animation |

## Desktop and motion

The invitation is one page at every width:

- **Below 700px:** the original single-column mobile layout.
- **700–959px:** a wider single column (up to 720px) with paper frames.
- **960px and above:** a wide editorial layout (up to 1240px): the opening cover splits into wording and envelope, the hero becomes photograph plus copy, details and gift cards sit in two columns, story becomes photograph plus timeline, and RSVP and the guestbook become copy plus form.
- **1300px and above:** the floating music button aligns with the invitation edge.

Opening sequence: seal fades → flap folds → letter rises → the cover crossfades into the invitation while the hero settles. It finishes in about 2 seconds. **Skip the opening**, Escape, and `prefers-reduced-motion` all reveal the invitation immediately.

While reading, headings, detail rows, story milestones and cards fade up once as they enter view. Content is visible without JavaScript; only `.motion-ready` hides items while waiting. Motion never moves text after it has been read, and forms never animate while focused.

The header links to the existing sections. No additional pages or sections were added.

## Replace with the real photos

Replace `assets/photos/demo-hanfu-couple.jpg` with your own portrait(s), preserving paths or editing the HTML. The invitation uses one image twice; production can use one landscape portrait for the reveal and multiple portraits for the story. Favor the **actual user-provided hanfu photos** over AI-generated placeholder people. Keep names, date, address, and RSVP text as HTML, not rasterized images.

## Core interaction sequence

1. **Sealed:** Envelope is composed from back, paper, front, flap, string, wax seal, tassel.
2. **Unseal:** Seal and string fade, flap rotates over the top edge.
3. **Unfold:** Paper lifts out from behind envelope pocket.
4. **Reveal:** Enter the full invitation with an unobstructed photo, then details and RSVP.

The opening crossfades into the invitation instead of unmounting the cover abruptly, and the whole sequence can be skipped. Section reveals are one-time and use `IntersectionObserver`; there is no animation library and no scroll hijacking.

## Production checklist

- Replace all placeholder copy and date, venue address, map URL, and real photos.
- **Replace the bank placeholders** in the Wedding Gift section: domestic account number, international account number, SWIFT/BIC, account name, and bank address.
- **Wire RSVP to a backend.** The invitation deliberately does not save or submit guest data.
- **Replace the background song** if needed: keep the path `assets/bgsong/a-heartbeats-turn.mp3` or update the `<audio>` source in `index.html`. Confirm you have permission to use the track, and compress it for mobile (the current file is about 2.6 MB).
- Prefer SVG layers over giant exported layouts to keep text crisp and language-neutral.
- Consider image compression and lazy loading for mobile users.
- Check the invitation at 320px, 390px, 768px, 1024px and 1440px, and confirm the two-column layouts do not clip long guest names.
- Check keyboard opening, Skip, Escape, and `prefers-reduced-motion` before publishing.
- The theme needs no external fonts or network calls.

## Licensing / usage note

The newly generated decorative SVG/PNG assets and prototype source are supplied for your wedding invitation implementation. A sample AI image is included only to show placement and should be replaced before publication. No font files are bundled.
