// Massachusetts RMV wait-times — front-end.
//
// Talks to the public mass.gov RMV API (CORS open), parses the XML response,
// joins each branch with the coords in branches.js, and renders dots on a
// dark MapLibre basemap. Auto-refreshes every 90 s.
//
// During off-hours the API returns a generic error; we show a "closed" state.

const API_URL    = 'https://9p83os0fkf.execute-api.us-east-1.amazonaws.com/v1/waittime';
const STYLE_URL  = 'https://tiles.openfreemap.org/styles/dark';
const REFRESH_MS = 90_000;

// ----- map -----
const map = new maplibregl.Map({
  container: 'map',
  style: STYLE_URL,
  center: [-71.7, 42.15],   // roughly Worcester (state-ish center)
  zoom: 7.4,
  minZoom: 6,
  maxZoom: 14,
  attributionControl: { compact: true },
});
map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

// ----- colors -----
const colors = {
  low:    getCss('--c-low'),
  mid:    getCss('--c-mid'),
  hi:     getCss('--c-hi'),
  vhi:    getCss('--c-vhi'),
  closed: getCss('--c-closed'),
};
function getCss(v) {
  return getComputedStyle(document.documentElement).getPropertyValue(v).trim();
}

function bucketColor(wait, branchOpen) {
  if (!branchOpen || wait == null) return colors.closed;
  if (wait < 15) return colors.low;
  if (wait < 45) return colors.mid;
  if (wait < 90) return colors.hi;
  return colors.vhi;
}

// ----- branches -> features (initial render: all closed) -----
const branchById = new Map();
const branches = (window.MA_RMV_BRANCHES || []).map((b) => {
  const o = { ...b, licensing: null, registration: null, open: false, total: null };
  branchById.set(b.key, o);
  return o;
});

function featuresFromBranches() {
  return {
    type: 'FeatureCollection',
    features: branches.map((b) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [b.lon, b.lat] },
      properties: {
        key: b.key, name: b.name, address: b.address,
        licensing: b.licensing, registration: b.registration,
        open: b.open, color: bucketColor(b.licensing, b.open),
      },
    })),
  };
}

map.on('load', () => {
  map.addSource('rmv', { type: 'geojson', data: featuresFromBranches() });
  map.addLayer({
    id: 'rmv-shadow',
    type: 'circle',
    source: 'rmv',
    paint: {
      'circle-radius': 11,
      'circle-color': '#000',
      'circle-opacity': 0.35,
      'circle-blur': 0.6,
    },
  });
  map.addLayer({
    id: 'rmv-dots',
    type: 'circle',
    source: 'rmv',
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 5, 11, 9],
      'circle-color': ['get', 'color'],
      'circle-stroke-color': '#0e1116',
      'circle-stroke-width': 1.5,
      'circle-opacity': 0.95,
    },
  });

  map.on('mouseenter', 'rmv-dots', () => (map.getCanvas().style.cursor = 'pointer'));
  map.on('mouseleave', 'rmv-dots', () => (map.getCanvas().style.cursor = ''));
  map.on('click', 'rmv-dots', (e) => {
    const f = e.features[0];
    const p = f.properties;
    const popupHtml = `
      <div class="popup">
        <div class="p-name">${esc(p.name)}</div>
        <div class="p-row"><span class="label">licensing</span><span>${fmtWait(p.licensing, p.open)}</span></div>
        <div class="p-row"><span class="label">registration</span><span>${fmtWait(p.registration, p.open)}</span></div>
        ${p.address ? `<div class="p-addr">${esc(p.address)}</div>` : ''}
      </div>`;
    new maplibregl.Popup({ closeButton: true, offset: 12 })
      .setLngLat(f.geometry.coordinates)
      .setHTML(popupHtml)
      .addTo(map);
  });

  refresh();
  setInterval(refresh, REFRESH_MS);
});

// ----- data fetch + parse -----
async function refresh() {
  setStatus('updating…');
  try {
    const r = await fetch(API_URL, { cache: 'no-store', headers: { Accept: 'application/xml' } });
    const text = await r.text();
    if (text.includes('"Message"') && text.includes('error')) {
      offHoursState();
      return;
    }
    const xml = new DOMParser().parseFromString(text, 'application/xml');
    if (xml.getElementsByTagName('parsererror').length) throw new Error('bad xml');
    applyWaitTimes(xml);
    setStatus('live', 'live');
    document.getElementById('updated').textContent = `updated ${new Date().toLocaleTimeString()}`;
  } catch (err) {
    console.error(err);
    setStatus('error fetching data', 'error');
  }
}

function applyWaitTimes(xml) {
  const branchNodes = Array.from(xml.getElementsByTagName('branch'));
  let totalWaiting = 0;
  let longest = { wait: 0, name: null };

  for (const o of branches) { o.licensing = null; o.registration = null; o.open = false; }

  for (const node of branchNodes) {
    const nameRaw =
      (node.getElementsByTagName('name')[0]?.textContent ||
       node.getAttribute('name') || '').trim();
    if (!nameRaw) continue;
    const lic = parseMinutes(node.getElementsByTagName('licensing')[0]?.textContent);
    const reg = parseMinutes(node.getElementsByTagName('registration')[0]?.textContent);
    const match = findBranch(nameRaw);
    if (!match) continue;
    match.licensing    = lic;
    match.registration = reg;
    match.open = lic != null || reg != null;
    if (lic != null) {
      totalWaiting += 1;          // we don't have raw counts, count branches reporting
      if (lic > longest.wait) longest = { wait: lic, name: match.name };
    }
  }

  // refresh source
  if (map.getSource('rmv')) map.getSource('rmv').setData(featuresFromBranches());
  renderSidebar();

  document.getElementById('totalWaiting').textContent =
    totalWaiting ? `${totalWaiting} branches reporting` : '—';
  document.getElementById('longestWait').textContent =
    longest.wait ? `${longest.wait} min · ${longest.name}` : '—';
}

function offHoursState() {
  for (const o of branches) { o.licensing = null; o.registration = null; o.open = false; }
  if (map.getSource('rmv')) map.getSource('rmv').setData(featuresFromBranches());
  renderSidebar();
  document.getElementById('totalWaiting').textContent = '—';
  document.getElementById('longestWait').textContent  = '—';
  setStatus('RMV is currently closed', 'closed');
  document.getElementById('updated').textContent = 'open Mon–Fri ~9am–5pm ET';
}

function setStatus(text, cls = '') {
  const el = document.getElementById('status');
  el.textContent = text;
  el.className = 'status ' + cls;
}

function parseMinutes(s) {
  if (!s) return null;
  const m = String(s).match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}

function findBranch(name) {
  const n = name.toLowerCase();
  return (
    branchById.get(n) ||
    branches.find((b) => b.key === n) ||
    branches.find((b) => n.includes(b.key)) ||
    branches.find((b) => b.key.includes(n))
  );
}

function fmtWait(min, open) {
  if (!open || min == null) return '—';
  return `${min} min`;
}

function esc(s) {
  return String(s || '').replace(/[&<>"]/g, (m) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
}

function renderSidebar() {
  const list = document.getElementById('branchList');
  const sorted = [...branches].sort((a, b) => {
    if (a.open !== b.open) return a.open ? -1 : 1;
    return (b.licensing ?? -1) - (a.licensing ?? -1);
  });
  list.innerHTML = sorted.map((b) => `
    <div class="branch">
      <span class="b-name">${esc(b.name)}</span>
      <span class="b-wait" style="color:${bucketColor(b.licensing, b.open)}">${fmtWait(b.licensing, b.open)}</span>
      <span class="b-sub">reg ${fmtWait(b.registration, b.open)}</span>
    </div>
  `).join('');
}
