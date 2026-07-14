import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CATEGORY_CONFIG, type Incident, type City } from '../data/incidents';
import BeforeAfterSlider from './BeforeAfterSlider';
import { useTheme } from '../context/ThemeContext';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const TILE_DARK  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_LIGHT = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

// ── Clustering logic ──────────────────────────────────────────────────────
// At very low zoom (< 11): merge ALL into one dot
// At medium zoom (11-14): cluster by proximity radius
// At high zoom (>= 15): individual markers

const ZOOM_SINGLE_CLUSTER = 11; // below this: one blue dot for everything
const ZOOM_INDIVIDUAL     = 15; // at or above this: individual dots

function getRadius(zoom: number): number {
  // Keep halving past zoom 15 instead of flattening out, so incidents that
  // are close together (but not identical) still separate into individual
  // markers once the user zooms in far enough.
  if (zoom > 15) return 0.0004 / Math.pow(2, zoom - 15);
  if (zoom === 15) return 0.0004;
  if (zoom >= 14) return 0.003;
  if (zoom >= 13) return 0.006;
  if (zoom >= 12) return 0.012;
  return 0.025;
}

function clusterIncidents(incidents: Incident[], radius: number): Incident[][] {
  const visited = new Set<string>();
  const clusters: Incident[][] = [];
  for (const inc of incidents) {
    if (visited.has(inc.id)) continue;
    const cluster = [inc];
    visited.add(inc.id);
    for (const other of incidents) {
      if (visited.has(other.id)) continue;
      const dlat = inc.lat - other.lat;
      const dlng = inc.lng - other.lng;
      if (Math.sqrt(dlat * dlat + dlng * dlng) < radius) {
        cluster.push(other);
        visited.add(other.id);
      }
    }
    clusters.push(cluster);
  }
  return clusters;
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

// ── Component ─────────────────────────────────────────────────────────────
interface CityMapProps {
  selectedIncident: Incident | null;
  onSelectIncident: (incident: Incident | null) => void;
  incidents: Incident[];
  city: City;
}

const CityMap: React.FC<CityMapProps> = ({ selectedIncident, onSelectIncident, incidents, city }) => {
  const containerRef  = useRef<HTMLDivElement>(null);
  const mapRef        = useRef<L.Map | null>(null);
  const tileRef       = useRef<L.TileLayer | null>(null);
  const markersGroup  = useRef<L.LayerGroup | null>(null);
  const heatGroup     = useRef<L.LayerGroup | null>(null);
  const { isDark }    = useTheme();
  const [zoom, setZoom]               = useState(city.zoom);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [city.lat, city.lng],
      zoom: city.zoom,
      zoomControl: false,
      attributionControl: false,
    });
    L.control.zoom({ position: 'topright' }).addTo(map);
    L.control.attribution({ position: 'bottomright', prefix: '© CitySense' }).addTo(map);
    const tile = L.tileLayer(isDark ? TILE_DARK : TILE_LIGHT, { maxZoom: 19 }).addTo(map);
    tileRef.current     = tile;
    markersGroup.current = L.layerGroup().addTo(map);
    heatGroup.current    = L.layerGroup().addTo(map);
    map.on('zoomend', () => setZoom(map.getZoom()));
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Tile theme
  useEffect(() => { tileRef.current?.setUrl(isDark ? TILE_DARK : TILE_LIGHT); }, [isDark]);

  // Fly to city
  useEffect(() => {
    mapRef.current?.flyTo([city.lat, city.lng], city.zoom, { duration: 1.2 });
  }, [city]);

  // Heatmap circles — a "hot zone" glow that only makes sense at city-wide
  // zoom levels. Its radius is in real-world meters, so at high zoom (once
  // individual markers are already visible) the same circle fills the whole
  // screen and hides the actual points, so it's hidden past that zoom.
  useEffect(() => {
    const hg = heatGroup.current;
    if (!hg) return;
    hg.clearLayers();
    if (zoom >= ZOOM_INDIVIDUAL) return;
    incidents.forEach(inc => {
      const cfg = CATEGORY_CONFIG[inc.category];
      const intensity = Math.min(inc.complaintsCount / 15, 1);
      const r = 80 + inc.complaintsCount * 10;
      L.circle([inc.lat, inc.lng], { radius: r * 2.2, color: 'transparent', fillColor: cfg.markerColor, fillOpacity: 0.04 + intensity * 0.06, weight: 0 }).addTo(hg);
      L.circle([inc.lat, inc.lng], { radius: r,       color: 'transparent', fillColor: cfg.markerColor, fillOpacity: 0.10 + intensity * 0.16, weight: 0 }).addTo(hg);
    });
  }, [incidents, zoom]);

  // Markers — re-draw whenever zoom changes or incidents change
  const drawMarkers = useCallback(() => {
    const mg  = markersGroup.current;
    const map = mapRef.current;
    if (!mg || !map) return;
    mg.clearLayers();

    const currentZoom = map.getZoom();

    // ── CASE 1: Very zoomed out — one big blue "super-cluster" ──
    if (currentZoom < ZOOM_SINGLE_CLUSTER && incidents.length > 0) {
      const centerLat = incidents.reduce((s, i) => s + i.lat, 0) / incidents.length;
      const centerLng = incidents.reduce((s, i) => s + i.lng, 0) / incidents.length;
      const total = incidents.reduce((s, i) => s + i.complaintsCount, 0);

      const icon = L.divIcon({
        html: `
          <div style="
            width:64px; height:64px;
            background: rgba(59,130,246,0.18);
            border: 2.5px solid #3B82F6;
            border-radius: 50%;
            display:flex; align-items:center; justify-content:center;
            color: #3B82F6;
            font-weight: 800;
            font-size: 18px;
            font-family: Inter,sans-serif;
            backdrop-filter: blur(8px);
            box-shadow: 0 0 28px rgba(59,130,246,0.45), inset 0 0 16px rgba(59,130,246,0.12);
            cursor: pointer;
          ">${total}</div>`,
        className: '',
        iconSize: [64, 64],
        iconAnchor: [32, 32],
      });
      const m = L.marker([centerLat, centerLng], { icon }).addTo(mg);
      m.on('click', () => map.flyTo([centerLat, centerLng], ZOOM_SINGLE_CLUSTER + 1, { duration: 0.8 }));
      return;
    }

    // ── CASE 2: Medium & high zoom — proper clustering ──
    const radius   = getRadius(currentZoom);
    const clusters = clusterIncidents(incidents, radius);

    clusters.forEach(cluster => {
      const total = cluster.reduce((s, i) => s + i.complaintsCount, 0);
      const centerLat = cluster.reduce((s, i) => s + i.lat, 0) / cluster.length;
      const centerLng = cluster.reduce((s, i) => s + i.lng, 0) / cluster.length;

      if (cluster.length === 1) {
        // ── Individual marker — a plain dot, no number, so it never reads
        // as a cluster bubble. The complaint count lives in the info card
        // that opens on click instead. ──
        const inc = cluster[0];
        const cfg = CATEGORY_CONFIG[inc.category];
        const isResolved = inc.status === 'resolved';
        const isCritical = inc.priority === 'critical';
        const baseSize = isResolved ? 16 : isCritical ? 22 : 18;

        const icon = L.divIcon({
          html: `
            <div style="
              width:${baseSize}px; height:${baseSize}px;
              background: ${cfg.markerColor};
              border: 2px solid rgba(255,255,255,0.9);
              border-radius: 50%;
              box-shadow: 0 0 ${baseSize}px ${cfg.markerColor}80;
              cursor: pointer;
              ${isCritical ? 'animation: m-pulse 1.4s ease-in-out infinite;' : ''}
            "></div>
            <style>
              @keyframes m-pulse {
                0%,100% { transform:scale(1); box-shadow:0 0 ${baseSize}px ${cfg.markerColor}80; }
                50%      { transform:scale(1.35); box-shadow:0 0 ${baseSize*2}px ${cfg.markerColor}; }
              }
            </style>`,
          className: '',
          iconSize: [baseSize, baseSize],
          iconAnchor: [baseSize / 2, baseSize / 2],
        });

        const m = L.marker([inc.lat, inc.lng], { icon }).addTo(mg);
        m.on('click', () => {
          onSelectIncident(inc);
        });

      } else {
        // ── Cluster bubble ──
        const catCounts: Partial<Record<string, number>> = {};
        cluster.forEach(inc => { catCounts[inc.category] = (catCounts[inc.category] ?? 0) + inc.complaintsCount; });
        const dom = Object.entries(catCounts).sort((a, b) => (b[1]??0) - (a[1]??0))[0][0] as keyof typeof CATEGORY_CONFIG;
        const color = CATEGORY_CONFIG[dom].markerColor;
        const size  = Math.min(72, 36 + cluster.length * 6);
        const fontSize = size < 46 ? 12 : size < 58 ? 14 : 17;

        const icon = L.divIcon({
          html: `
            <div style="
              width:${size}px; height:${size}px;
              background: rgba(${hexToRgb(color)},0.18);
              border: 2.5px solid ${color};
              border-radius: 50%;
              display: flex; align-items: center; justify-content: center;
              color: ${color};
              font-weight: 800;
              font-size: ${fontSize}px;
              font-family: Inter,sans-serif;
              cursor: pointer;
              backdrop-filter: blur(8px);
              box-shadow: 0 0 24px ${color}50;
              transition: transform 0.2s ease;
            "
            onmouseover="this.style.transform='scale(1.1)'"
            onmouseout="this.style.transform='scale(1)'"
            >${total}</div>`,
          className: '',
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const m = L.marker([centerLat, centerLng], { icon }).addTo(mg);
        m.on('click', () => {
          const nextZoom = Math.min(map.getZoom() + 2, 18);
          map.flyTo([centerLat, centerLng], nextZoom, { duration: 0.7 });
          onSelectIncident(cluster[0]);
        });
      }
    });
  }, [incidents, onSelectIncident]);

  useEffect(() => { drawMarkers(); }, [zoom, drawMarkers]);

  // Fly to selected
  useEffect(() => {
    if (selectedIncident && mapRef.current) {
      mapRef.current.flyTo([selectedIncident.lat, selectedIncident.lng], 16, { duration: 0.8 });
    }
  }, [selectedIncident]);

  const hasBeforeAfter = selectedIncident?.status === 'resolved' && selectedIncident?.beforePhoto && selectedIncident?.afterPhoto;
  const singlePhoto = !hasBeforeAfter ? (selectedIncident?.beforePhoto || selectedIncident?.afterPhoto) : null;

  const PRIORITY_LABELS: Record<string, string> = { low: 'Низький', medium: 'Середній', high: 'Високий', critical: 'Критичний' };
  const PRIORITY_COLORS: Record<string, string> = { low: '#10B981', medium: '#F59E0B', high: '#F97316', critical: '#EF4444' };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Incident info card — shown for any selected marker */}
      {selectedIncident && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-start', zIndex: 50, padding: 24, pointerEvents: 'none' }}>
          <div className="glass-card" style={{ padding: 16, width: 340, maxHeight: '70%', overflowY: 'auto', pointerEvents: 'auto', background: 'var(--bg-card)', borderRadius: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10, gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <h4 style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{selectedIncident.title}</h4>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>📍 {selectedIncident.location}</p>
              </div>
              <button
                onClick={() => onSelectIncident(null)}
                style={{ width: 28, height: 28, flexShrink: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, background: 'var(--bg-glass)', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              <span
                className="badge"
                style={{
                  background: CATEGORY_CONFIG[selectedIncident.category].bgColor,
                  color: CATEGORY_CONFIG[selectedIncident.category].color,
                  border: `1px solid ${CATEGORY_CONFIG[selectedIncident.category].borderColor}`,
                  fontSize: 11, padding: '3px 8px', borderRadius: 20,
                }}
              >
                {CATEGORY_CONFIG[selectedIncident.category].label}
              </span>
              <span
                className="badge"
                style={{
                  background: `${PRIORITY_COLORS[selectedIncident.priority]}20`,
                  color: PRIORITY_COLORS[selectedIncident.priority],
                  border: `1px solid ${PRIORITY_COLORS[selectedIncident.priority]}40`,
                  fontSize: 11, padding: '3px 8px', borderRadius: 20,
                }}
              >
                {PRIORITY_LABELS[selectedIncident.priority]}
              </span>
            </div>

            <p style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-secondary)', marginBottom: 10 }}>
              {selectedIncident.description}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: hasBeforeAfter || singlePhoto ? 10 : 0 }}>
              <span>👥 {selectedIncident.complaintsCount} скарг</span>
              <span>🏢 {selectedIncident.department}</span>
              <span>🕐 {selectedIncident.timeAgo}</span>
            </div>

            {hasBeforeAfter && (
              <>
                <BeforeAfterSlider beforeSrc={selectedIncident.beforePhoto!} afterSrc={selectedIncident.afterPhoto!} />
                <p style={{ fontSize: 11, marginTop: 8, textAlign: 'center', color: 'var(--text-muted)' }}>← Перетягніть →</p>
              </>
            )}

            {singlePhoto && (
              <img
                src={singlePhoto}
                alt={selectedIncident.title}
                style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 10 }}
              />
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div
        className="glass-card cs-map-legend"
        style={{ position: 'absolute', bottom: 20, left: 20, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8, zIndex: 10 }}
      >
        {Object.entries(CATEGORY_CONFIG).map(([k, cfg]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--text-secondary)' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: cfg.markerColor, boxShadow: `0 0 6px ${cfg.markerColor}70` }} />
            {cfg.label}
          </div>
        ))}
      </div>

      {/* Zoom level info */}
      <div
        className="glass-card"
        style={{ position: 'absolute', top: 16, right: 56, padding: '6px 12px', fontSize: 11, zIndex: 10, color: 'var(--text-muted)' }}
      >
        {zoom < ZOOM_SINGLE_CLUSTER ? '🔵 Загальний кластер' : zoom >= ZOOM_INDIVIDUAL ? '📍 Окремі маркери' : `🔢 Кластери (zoom ${zoom})`}
      </div>
    </div>
  );
};

export default CityMap;
