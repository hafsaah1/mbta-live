# MBTA · Live

Every MBTA bus, train, and ferry in Massachusetts, on a map, updating every 8
seconds. ~500–1000 moving dots at any given time.

**Live:** https://hafsaah1.github.io/mbta-live/

Same spirit as [Riley Walz's CA-DMV](https://walzr.com/CA-DMV/) — a live map of
public infrastructure, built as a fully static page with no backend.

## How it works

- The MBTA's [v3 REST API](https://www.mbta.com/developers/v3-api) is open,
  free, CORS-friendly, and returns JSON. So the browser hits it directly — no
  cron, no database, no proxy.
- On load: one call to `/routes` to learn each route's official color + name.
- Then every 8 s: one call to `/vehicles?include=route` to get every active
  vehicle's lat/lon, status, speed, and route, and we re-render.
- Each vehicle is a dot colored by the line — Red, Orange, Blue, Green
  branches, Commuter Rail purple, bus yellow, ferry teal.
- Click a dot → popup with route, status, speed, vehicle ID, and occupancy.

## Files

| File | Role |
|------|------|
| `index.html` | Page shell + layout. |
| `style.css`  | Dark theme + MBTA line colors. |
| `app.js`     | Fetch / parse / paint loop (~200 lines). |

## Run locally

```sh
python3 -m http.server 8080
# open http://localhost:8080
```

No build step, no install. Two CDN scripts (MapLibre + the OpenFreeMap tile
style) and the MBTA's public API do all the heavy lifting.
