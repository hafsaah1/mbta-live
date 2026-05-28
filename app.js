// MBTA live vehicle map — front-end.
//
// One-time: fetch /routes to learn each route's official color + display name.
// Then poll /vehicles every ~8s and render every active bus, train, and ferry
// on a MapLibre dark basemap, colored by route. Open CORS, no auth, no backend.

const API   = 'https://api-v3.mbta.com';
const STYLE = 'https://tiles.openfreemap.org/styles/positron';
const REFRESH_MS = 8_000;

// ----- map -----
const map = new maplibregl.Map({
  container: 'map',
  style: STYLE,
  center: [-71.06, 42.355],   // Boston
  zoom: 11.4,
  minZoom: 8,
  maxZoom: 16,
  attributionControl: { compact: true },
});
map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

// ----- state -----
const routes = new Map();   // route_id -> { name, color, type, mode }

function modeOf(routeType, routeId) {
  // MBTA route types: 0 tram/light-rail, 1 subway, 2 commuter rail, 3 bus, 4 ferry
  if (routeType === 2) return 'CR';
  if (routeType === 3) return 'Bus';
  if (routeType === 4) return 'Ferry';
  if (routeId === 'Red' || routeId === 'Mattapan') return 'Red';
  if (routeId === 'Orange') return 'Orange';
  if (routeId === 'Blue') return 'Blue';
  if (routeId && routeId.startsWith('Green')) return 'Green';
  if (routeId && routeId.startsWith('74') /* silver line bus IDs vary */) return 'Other';
  return 'Other';
}

function cssColor(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(`--c-${name}`).trim();
}
const MODE_COLOR = {
  Red:    cssColor('red'),
  Orange: cssColor('orange'),
  Blue:   cssColor('blue'),
  Green:  cssColor('green'),
  CR:     cssColor('cr'),
  Bus:    cssColor('bus'),
  Ferry:  cssColor('ferry'),
  Other:  cssColor('silver'),
};

// ----- init -----
map.on('load', async () => {
  map.addSource('vehicles', { type: 'geojson', data: emptyFC() });
  map.addLayer({
    id: 'veh-shadow',
    type: 'circle',
    source: 'vehicles',
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 9, 4, 14, 9],
      'circle-color': '#000',
      'circle-opacity': 0.4,
      'circle-blur': 0.7,
    },
  });
  map.addLayer({
    id: 'veh-dots',
    type: 'circle',
    source: 'vehicles',
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 9, 3, 14, 7],
      'circle-color': ['get', 'color'],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1.2,
      'circle-opacity': 0.95,
    },
  });

  map.on('mouseenter', 'veh-dots', () => (map.getCanvas().style.cursor = 'pointer'));
  map.on('mouseleave', 'veh-dots', () => (map.getCanvas().style.cursor = ''));
  map.on('click', 'veh-dots', (e) => {
    const f = e.features[0];
    const p = f.properties;
    new maplibregl.Popup({ closeButton: true, offset: 10 })
      .setLngLat(f.geometry.coordinates)
      .setHTML(`
        <div class="popup">
          <div class="p-name" style="color:${p.color}">${esc(p.routeName)}</div>
          <div class="p-row"><span class="label">status</span><span>${esc(p.status)}</span></div>
          <div class="p-row"><span class="label">speed</span><span>${p.speed ? Math.round(p.speed * 2.237) + ' mph' : '—'}</span></div>
          <div class="p-row"><span class="label">vehicle</span><span>${esc(p.label || p.id)}</span></div>
          ${p.occupancy ? `<div class="p-sub">occupancy: ${esc(p.occupancy.toLowerCase().replace(/_/g, ' '))}</div>` : ''}
        </div>`)
      .addTo(map);
  });

  await loadRoutes();
  refresh();
  setInterval(refresh, REFRESH_MS);
});

// ----- routes (once) -----
async function loadRoutes() {
  try {
    const r = await fetch(`${API}/routes?fields[route]=long_name,short_name,color,type`);
    const j = await r.json();
    for (const it of j.data) {
      const a = it.attributes;
      const mode = modeOf(a.type, it.id);
      routes.set(it.id, {
        name: a.long_name || a.short_name || it.id,
        short: a.short_name || '',
        color: a.color ? `#${a.color}` : MODE_COLOR[mode],
        type: a.type,
        mode,
      });
    }
  } catch (e) { console.error('loadRoutes', e); }
}

// ----- vehicles (poll) -----
async function refresh() {
  try {
    setStatus('updating…');
    const r = await fetch(
      `${API}/vehicles?fields[vehicle]=latitude,longitude,bearing,current_status,speed,label,occupancy_status&include=route&page[limit]=2000`,
      { cache: 'no-store' }
    );
    if (!r.ok) throw new Error('http ' + r.status);
    const j = await r.json();
    render(j.data);
    setStatus('live', 'live');
    document.getElementById('updated').textContent = `updated ${new Date().toLocaleTimeString()}`;
  } catch (e) {
    console.error(e);
    setStatus('error fetching data', 'error');
  }
}

function render(vehicles) {
  const counts = { Red: 0, Orange: 0, Blue: 0, Green: 0, CR: 0, Bus: 0, Ferry: 0, Other: 0 };
  const byRoute = new Map();
  const feats = [];

  for (const v of vehicles) {
    const a = v.attributes;
    if (a.latitude == null || a.longitude == null) continue;
    const routeId = v.relationships?.route?.data?.id;
    const meta = routes.get(routeId) || { name: routeId || 'unknown', color: MODE_COLOR.Other, mode: 'Other', short: '' };
    counts[meta.mode] = (counts[meta.mode] || 0) + 1;
    const tally = byRoute.get(routeId) || { name: meta.name, color: meta.color, n: 0 };
    tally.n++;
    byRoute.set(routeId, tally);

    feats.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [a.longitude, a.latitude] },
      properties: {
        id: v.id,
        routeId,
        routeName: meta.short ? `${meta.short} — ${meta.name}` : meta.name,
        color: meta.color,
        status: (a.current_status || '').toLowerCase().replace(/_/g, ' '),
        speed: a.speed,
        bearing: a.bearing,
        label: a.label,
        occupancy: a.occupancy_status,
      },
    });
  }

  const src = map.getSource('vehicles');
  if (src) src.setData({ type: 'FeatureCollection', features: feats });

  document.getElementById('vehTotal').textContent = feats.length.toString();
  for (const k of Object.keys(counts)) {
    const el = document.getElementById('cnt-' + k);
    if (el) el.textContent = counts[k] || '·';
  }

  // top routes
  const top = [...byRoute.values()].sort((a, b) => b.n - a.n).slice(0, 12);
  document.getElementById('topRoutes').innerHTML =
    `<div class="legend-title" style="margin-bottom:8px">busiest routes</div>` +
    top.map((r) => `
      <div class="branch">
        <span class="b-name" style="color:${r.color}">${esc(r.name)}</span>
        <span class="b-wait">${r.n}</span>
      </div>
    `).join('');
}

function emptyFC() { return { type: 'FeatureCollection', features: [] }; }
function setStatus(text, cls = '') {
  const el = document.getElementById('status');
  el.textContent = text;
  el.className = 'status ' + cls;
}
function esc(s) {
  return String(s ?? '').replace(/[&<>"]/g, (m) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
}
