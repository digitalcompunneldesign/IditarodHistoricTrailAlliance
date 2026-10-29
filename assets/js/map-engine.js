/* ==========================================================================
   MAP ENGINE — a thin MapLibre wrapper shared by every map on the site.
   Basemap: Esri World Imagery + place labels (no key; attribution shown).
   To move to MapTiler or the Alliance's own ArcGIS basemap, change
   MAP_CONFIG only.
   ========================================================================== */
window.MAP_CONFIG = {
  provider: 'esri',           // 'esri' | 'maptiler'
  maptilerKey: '',
  routeColor: '#e9b949',
  alaska: [[-166.5, 59.6], [-148.6, 65.3]]   // frames Seward → Nome
};

window.InhtMap = (function () {
  function style() {
    const C = window.MAP_CONFIG;
    if (C.provider === 'maptiler' && C.maptilerKey) return `https://api.maptiler.com/maps/hybrid/style.json?key=${C.maptilerKey}`;
    return {
      version: 8,
      sources: {
        sat: { type: 'raster', tileSize: 256, maxzoom: 17,
          tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
          attribution: 'Imagery © Esri, Maxar, Earthstar Geographics · Route approximate, after BLM' },
        labels: { type: 'raster', tileSize: 256, maxzoom: 16,
          tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'] }
      },
      layers: [
        { id: 'bg', type: 'background', paint: { 'background-color': '#1d2a33' } },
        { id: 'sat', type: 'raster', source: 'sat', paint: { 'raster-saturation': -0.25, 'raster-brightness-max': 0.92 } },
        { id: 'labels', type: 'raster', source: 'labels', paint: { 'raster-opacity': 0.55 } },
        { id: 'wash', type: 'background', paint: { 'background-color': '#2a0b14', 'background-opacity': 0.22 } }
      ]
    };
  }

  async function route() {
    if (window.TRAIL_GEOJSON_URL) {
      try {
        const gj = await (await fetch(window.TRAIL_GEOJSON_URL)).json();
        const f = gj.type === 'FeatureCollection' ? gj.features[0] : gj;
        return { coords: (f.geometry || f).coordinates, source: 'geojson' };
      } catch (err) { console.warn('Route GeoJSON unavailable, using the approximate trace:', err.message); }
    }
    return { coords: window.TRAIL_ROUTE, source: 'approx' };
  }

  function create(el, opts = {}) {
    const touch = window.matchMedia('(max-width: 860px)').matches;
    const map = new maplibregl.Map({
      container: el, style: style(), bounds: window.MAP_CONFIG.alaska,
      fitBoundsOptions: { padding: opts.padding || 30 },
      attributionControl: { compact: true }, dragRotate: false, pitchWithRotate: false,
      scrollZoom: !!opts.scrollZoom, cooperativeGestures: !!opts.cooperative,
      dragPan: opts.dragPan !== undefined ? opts.dragPan : !touch, touchZoomRotate: true
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), opts.controls || 'bottom-right');
    return map;
  }

  function whenReady(map, fn) {
    let ran = false;
    const run = () => { if (!ran) { ran = true; fn(); } };
    if (map.loaded()) run(); else map.once('load', run);
    setTimeout(() => { if (map.isStyleLoaded()) run(); }, 4000);   // imagery blocked: draw anyway
  }

  function addRoute(map, coords, withProgress) {
    map.addSource('trail', { type: 'geojson', lineMetrics: !!withProgress,
      data: { type: 'Feature', geometry: { type: 'LineString', coordinates: coords } } });
    map.addLayer({ id: 'trail-glow', type: 'line', source: 'trail', layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#000', 'line-width': 8, 'line-opacity': 0.35, 'line-blur': 4 } });
    map.addLayer({ id: 'trail-line', type: 'line', source: 'trail', layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': window.MAP_CONFIG.routeColor, 'line-width': ['interpolate', ['linear'], ['zoom'], 4, 3, 10, 5],
               'line-dasharray': [2, 1.2] } });
  }

  /* distance helpers — stops are measured along whichever line loaded */
  const R = 6371000, rad = d => d * Math.PI / 180;
  function hav(a, b) {
    const dLat = rad(b[1] - a[1]), dLng = rad(b[0] - a[0]);
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  }
  function cumulative(line) { const c = [0]; for (let i = 1; i < line.length; i++) c[i] = c[i - 1] + hav(line[i - 1], line[i]); return c; }
  function snap(pt, line, cum) {
    let best = { d: Infinity, coord: line[0], along: 0 };
    for (let i = 0; i < line.length - 1; i++) {
      const a = line[i], b = line[i + 1], k = Math.cos(rad(a[1]));
      const dx = (b[0] - a[0]) * k, dy = b[1] - a[1];
      const len = dx * dx + dy * dy;
      let t = len ? (((pt[0] - a[0]) * k) * dx + (pt[1] - a[1]) * dy) / len : 0;
      t = Math.max(0, Math.min(1, t));
      const c = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      const d = hav(pt, c);
      if (d < best.d) best = { d, coord: c, along: cum[i] + hav(a, c) };
    }
    return best;
  }

  return { create, whenReady, addRoute, route, cumulative, snap, hav };
})();
