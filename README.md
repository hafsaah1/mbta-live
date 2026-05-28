# MA RMV Wait Times

A live map of every Massachusetts RMV Service Center with current
licensing + registration wait times.

**Live:** https://hafsaah1.github.io/mass-rmv-wait-times/

Inspired by [Riley Walz's CA-DMV](https://walzr.com/CA-DMV/) — same idea, for
Massachusetts instead of California.

## How it works

- The MA RMV publishes a public AWS API that returns XML for every branch:
  `https://9p83os0fkf.execute-api.us-east-1.amazonaws.com/v1/waittime`
- It's the backend behind [massgov.github.io/rmvwaittime](https://massgov.github.io/rmvwaittime/),
  the state's own (per-branch) wait-time page. CORS is wide open, so the browser
  hits it directly — **no backend, no cron, no database**.
- A static page (HTML + CSS + ~200 lines of vanilla JS) parses the XML, joins
  each branch with hardcoded coordinates in `branches.js`, and renders dots on
  a [OpenFreeMap](https://openfreemap.org) dark basemap via
  [MapLibre](https://maplibre.org/).
- Auto-refreshes every 90 seconds. When the RMV is closed, the API errors and
  the page shows a "RMV currently closed" state instead.

## Files

| File | What it does |
|------|--------------|
| `index.html` | Page shell + layout. |
| `style.css`  | Dark utility theme. |
| `branches.js`| Hardcoded list of MA RMV branches with lat/lon. |
| `app.js`     | Fetches the API, parses XML, paints the map and sidebar. |

## Run locally

```sh
python3 -m http.server 8080
# open http://localhost:8080
```

That's it. No build step. No dependencies beyond two CDN scripts (MapLibre + the
OpenFreeMap tile style).
