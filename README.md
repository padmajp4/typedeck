# TypeScope

Preview and compare thousands of typefaces side by side with live text, size,
spacing and leading controls — a browser-based font browser in the spirit of
Wordmark.it, with no uploads.

## Font sources

| Source | Count | How it loads |
| --- | --- | --- |
| Google Fonts | ~1,950 families | Catalogue via `fonts.google.com/metadata/fonts`, faces via the `css2` API |
| Fontshare | 100 families | Catalogue via `api.fontshare.com`, faces via `FontFace` from the Fontshare CDN |
| Your fonts | whatever is installed | [Local Font Access API](https://developer.mozilla.org/en-US/docs/Web/API/Local_Font_Access_API) (Chromium only, permission-gated) |

Neither remote catalogue needs an API key.

## Features

- Live preview text, font size, letter-spacing and line-height
- Weight (300–900) and italic toggles that load the family's **real** cut rather
  than a browser-synthesised one
- Filter by source and category; search by family or designer name
- Favourite, hide and select fonts — all persisted to `localStorage`
- Sort by popularity, A–Z, Z–A, recently added, or random
- 1/2/3/4/6 column layouts
- Auto-scroll at 0.5×–5× for browsing long lists hands-free
- Export the selected fonts as CSS, HTML or a plain name list
- Light and dark themes, applied before first paint

## Performance

The catalogue is ~2,000 families, so two things keep it responsive:

- **Infinite scroll** renders 48 cards at a time rather than all of them.
- **Per-style lazy loading** — a family's webfont is requested only when its card
  nears the viewport, and only in the weight and slant currently previewed.
  Each `family@weight` combination is fetched at most once per session.

## Development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
```

## Deploying to Vercel

The app is a stock Next.js App Router project with no environment variables, so
it deploys as-is:

```bash
npx vercel        # preview
npx vercel --prod # production
```

Or import the repository at [vercel.com/new](https://vercel.com/new) and accept
the detected defaults. Both catalogue routes are statically generated and
revalidated daily, so the upstream APIs are hit roughly once a day rather than
once per visitor.
