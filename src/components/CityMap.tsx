import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CATEGORY_CONFIG, type Incident, type City } from '../data/incidents';
import { useTheme } from '../context/ThemeContext';
import { getSmartCityData, ZONE_LEVEL_LABELS, type Sensor, type DangerZone } from '../data/smartCityData';

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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const PRIORITY_LABELS: Record<string, string> = { low: 'Низький', medium: 'Середній', high: 'Високий', critical: 'Критичний' };
const PRIORITY_COLORS: Record<string, string> = { low: '#10B981', medium: '#F59E0B', high: '#F97316', critical: '#EF4444' };

// ── Hover tooltip — compact preview ─────────────────────────────────────
function buildTooltipHtml(inc: Incident): string {
  const cfg = CATEGORY_CONFIG[inc.category];
  return `
    <div class="cs-map-tip">
      <div class="cs-map-tip__title">${escapeHtml(inc.title)}</div>
      <div class="cs-map-tip__row">
        <span class="cs-map-tip__badge" style="background:${cfg.bgColor};color:${cfg.color};border-color:${cfg.borderColor}">${cfg.label}</span>
        <span class="cs-map-tip__badge" style="background:${PRIORITY_COLORS[inc.priority]}22;color:${PRIORITY_COLORS[inc.priority]};border-color:${PRIORITY_COLORS[inc.priority]}55">${PRIORITY_LABELS[inc.priority]}</span>
      </div>
      <div class="cs-map-tip__meta">👥 ${inc.complaintsCount} скарг · 📍 ${escapeHtml(inc.location)}</div>
    </div>`;
}

// ── Click popup — full detail card ──────────────────────────────────────
function buildPopupHtml(inc: Incident): string {
  const cfg = CATEGORY_CONFIG[inc.category];
  const hasBeforeAfter = inc.status === 'resolved' && inc.beforePhoto && inc.afterPhoto;
  const singlePhoto = !hasBeforeAfter ? (inc.beforePhoto || inc.afterPhoto) : null;

  let photosHtml = '';
  if (hasBeforeAfter) {
    photosHtml = `
      <div class="cs-map-popup__photos">
        <div class="cs-map-popup__photo-col">
          <img src="${inc.beforePhoto}" alt="До" />
          <span>До</span>
        </div>
        <div class="cs-map-popup__photo-col">
          <img src="${inc.afterPhoto}" alt="Після" />
          <span>Після</span>
        </div>
      </div>`;
  } else if (singlePhoto) {
    photosHtml = `<img class="cs-map-popup__photo" src="${singlePhoto}" alt="${escapeHtml(inc.title)}" />`;
  }

  return `
    <div class="cs-map-popup">
      <div class="cs-map-popup__title">${escapeHtml(inc.title)}</div>
      <div class="cs-map-popup__location">📍 ${escapeHtml(inc.location)}</div>
      <div class="cs-map-popup__badges">
        <span class="cs-map-popup__badge" style="background:${cfg.bgColor};color:${cfg.color};border-color:${cfg.borderColor}">${cfg.label}</span>
        <span class="cs-map-popup__badge" style="background:${PRIORITY_COLORS[inc.priority]}22;color:${PRIORITY_COLORS[inc.priority]};border-color:${PRIORITY_COLORS[inc.priority]}55">${PRIORITY_LABELS[inc.priority]}</span>
      </div>
      <p class="cs-map-popup__desc">${escapeHtml(inc.description)}</p>
      <div class="cs-map-popup__meta">
        <span>👥 ${inc.complaintsCount} скарг</span>
        <span>🏢 ${escapeHtml(inc.department)}</span>
        <span>🕐 ${escapeHtml(inc.timeAgo)}</span>
      </div>
      ${photosHtml}
    </div>`;
}

function buildSensorTooltipHtml(sensor: Sensor, statusColor: string, statusLabel: string): string {
  return `
    <div class="cs-map-tip">
      <div class="cs-map-tip__title">${escapeHtml(sensor.name)}</div>
      <div class="cs-map-tip__row">
        <span class="cs-map-tip__badge" style="background:${statusColor}22;color:${statusColor};border-color:${statusColor}55">${statusLabel}</span>
      </div>
      <div class="cs-map-tip__meta">Показник: <strong>${escapeHtml(sensor.value)}</strong></div>
    </div>`;
}

function buildSensorPopupHtml(sensor: Sensor, statusColor: string, statusLabel: string): string {
  const typeLabels: Record<string, string> = {
    air: 'Якість повітря',
    water: 'Якість води',
    storm: 'Рівень зливової системи',
    temp: 'Температура та вологість',
    noise: 'Рівень шуму'
  };
  return `
    <div class="cs-map-popup">
      <div class="cs-map-popup__title">📡 ${escapeHtml(sensor.name)}</div>
      <div class="cs-map-popup__location">Тип: ${typeLabels[sensor.type] || sensor.type}</div>
      <div class="cs-map-popup__badges">
        <span class="cs-map-popup__badge" style="background:${statusColor}22;color:${statusColor};border-color:${statusColor}55">${statusLabel}</span>
      </div>
      <p class="cs-map-popup__desc" style="font-size: 11.5px; margin: 8px 0; font-style: italic; color: var(--text-secondary);">
        <strong>🤖 ШІ-Коментар:</strong> ${escapeHtml(sensor.aiComment)}
      </p>
      <div class="cs-map-popup__meta">
        <span>Показник: <strong>${escapeHtml(sensor.value)}</strong></span>
        <span>Оновлено: ${escapeHtml(sensor.lastUpdated)}</span>
      </div>
    </div>`;
}

function buildZoneTooltipHtml(zone: DangerZone): string {
  return `
    <div class="cs-map-tip">
      <div class="cs-map-tip__title">${escapeHtml(zone.name)}</div>
      <div class="cs-map-tip__row">
        <span class="cs-map-tip__badge" style="background:${zone.color}22;color:${zone.color};border-color:${zone.color}55">${ZONE_LEVEL_LABELS[zone.level]}</span>
      </div>
    </div>`;
}

function buildZonePopupHtml(zone: DangerZone): string {
  return `
    <div class="cs-map-popup" style="width: 270px;">
      <div class="cs-map-popup__title">⚠️ ${escapeHtml(zone.name)}</div>
      <div class="cs-map-popup__badges">
        <span class="cs-map-popup__badge" style="background:${zone.color}22;color:${zone.color};border-color:${zone.color}55">${ZONE_LEVEL_LABELS[zone.level]}</span>
      </div>
      <div style="font-size: 12px; color: var(--text-primary); margin-bottom: 6px; line-height: 1.4;">
        <strong>Причина:</strong> ${escapeHtml(zone.reasons)}
      </div>
      <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px; line-height: 1.4;">
        <strong>Наслідки:</strong> ${escapeHtml(zone.consequences)}
      </div>
      <div style="font-size: 11.5px; color: var(--accent); background: var(--accent-dim); border: 1px solid var(--border-color); border-radius: 8px; padding: 8px; margin-top: 6px; line-height: 1.45;">
        <strong>🤖 ШІ-Рекомендація:</strong> ${escapeHtml(zone.aiRecommendation)}
      </div>
    </div>`;
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
  const sensorsGroup  = useRef<L.LayerGroup | null>(null);
  const zonesGroup    = useRef<L.LayerGroup | null>(null);
  const markersById   = useRef<Map<string, L.Marker>>(new Map());
  const { isDark }    = useTheme();
  const [zoom, setZoom]               = useState(city.zoom);

  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({
    all: true,
    sensors: true,
    air: true,
    water: true,
    weather: true,
    zones: true,
    incidents: true,
  });

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const { sensors, dangerZones } = React.useMemo(() => {
    return getSmartCityData(city.id, city, incidents, tick);
  }, [city, incidents, tick]);

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
    sensorsGroup.current = L.layerGroup().addTo(map);
    zonesGroup.current   = L.layerGroup().addTo(map);
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
    markersById.current.clear();

    if (!activeLayers.incidents) return;

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
        // as a cluster bubble. Hover shows a quick preview tooltip, click
        // opens a full detail popup anchored to the marker. ──
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

        const m = L.marker([inc.lat, inc.lng], { icon })
          .bindTooltip(buildTooltipHtml(inc), {
            direction: 'top',
            offset: [0, -baseSize / 2],
            opacity: 1,
            className: 'cs-map-tip-wrapper',
          })
          .bindPopup(buildPopupHtml(inc), {
            className: 'cs-map-popup-wrapper',
            maxWidth: 300,
            offset: [0, -baseSize / 2],
          })
          .addTo(mg);

        m.on('click', () => onSelectIncident(inc));
        markersById.current.set(inc.id, m);

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

        const clusterCount = cluster.length;
        const m = L.marker([centerLat, centerLng], { icon })
          .bindTooltip(`<div class="cs-map-tip"><div class="cs-map-tip__title">${clusterCount} інцидентів у цій зоні</div><div class="cs-map-tip__meta">Клікніть, щоб наблизити</div></div>`, {
            direction: 'top',
            offset: [0, -size / 2],
            opacity: 1,
            className: 'cs-map-tip-wrapper',
          })
          .addTo(mg);
        m.on('click', () => {
          const nextZoom = Math.min(map.getZoom() + 2, 18);
          map.flyTo([centerLat, centerLng], nextZoom, { duration: 0.7 });
        });
      }
    });
  }, [incidents, onSelectIncident, activeLayers.incidents]);

  useEffect(() => { drawMarkers(); }, [zoom, drawMarkers]);

  // Draw sensors and danger zones
  useEffect(() => {
    const map = mapRef.current;
    const sg = sensorsGroup.current;
    const zg = zonesGroup.current;
    if (!map || !sg || !zg) return;

    sg.clearLayers();
    zg.clearLayers();

    // 1. Draw Danger Zones if enabled
    if (activeLayers.zones) {
      dangerZones.forEach(zone => {
        // Filter out if specific type layer is off
        if (zone.type === 'air' && !activeLayers.air) return;
        if (zone.type === 'water' && !activeLayers.water) return;
        if ((zone.type === 'storm' || zone.type === 'icing' || zone.type === 'heat') && !activeLayers.weather) return;

        L.circle([zone.lat, zone.lng], {
          radius: zone.radius,
          color: zone.color,
          fillColor: zone.color,
          fillOpacity: 0.15,
          weight: 1.5,
          dashArray: '4, 4',
        })
        .bindTooltip(buildZoneTooltipHtml(zone), {
          direction: 'top',
          opacity: 1,
          className: 'cs-map-tip-wrapper',
        })
        .bindPopup(buildZonePopupHtml(zone), {
          className: 'cs-map-popup-wrapper',
          maxWidth: 290,
        })
        .addTo(zg);
      });
    }

    // 2. Draw Sensors if enabled
    if (activeLayers.sensors) {
      sensors.forEach(sensor => {
        // Filter out if specific type layer is off
        if (sensor.type === 'air' && !activeLayers.air) return;
        if (sensor.type === 'water' && !activeLayers.water) return;
        if ((sensor.type === 'storm' || sensor.type === 'temp' || sensor.type === 'noise') && !activeLayers.weather) return;

        const statusColor = sensor.status === 'danger' ? '#EF4444' : sensor.status === 'warning' ? '#F59E0B' : '#10B981';
        const statusLabel = sensor.status === 'danger' ? 'Небезпека' : sensor.status === 'warning' ? 'Попередження' : 'Норма';
        const typeIcon = sensor.type === 'air' ? '🍃' : sensor.type === 'water' ? '💧' : sensor.type === 'storm' ? '🌧️' : sensor.type === 'temp' ? '🌡️' : '🔊';

        const sensorIcon = L.divIcon({
          html: `
            <div style="
              width: 32px; height: 32px;
              background: ${statusColor};
              border: 2px solid rgba(255,255,255,0.9);
              border-radius: 50%;
              display: flex; align-items: center; justify-content: center;
              font-size: 15px;
              box-shadow: 0 0 12px ${statusColor}cc;
              cursor: pointer;
              ${sensor.status === 'danger' ? 'animation: sensor-pulse 1.2s ease-in-out infinite;' : ''}
            ">${typeIcon}</div>
            <style>
              @keyframes sensor-pulse {
                0%, 100% { box-shadow: 0 0 12px ${statusColor}cc; transform: scale(1); }
                50% { box-shadow: 0 0 20px ${statusColor}; transform: scale(1.1); }
              }
            </style>
          `,
          className: '',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        L.marker([sensor.lat, sensor.lng], { icon: sensorIcon })
          .bindTooltip(buildSensorTooltipHtml(sensor, statusColor, statusLabel), {
            direction: 'top',
            offset: [0, -16],
            opacity: 1,
            className: 'cs-map-tip-wrapper',
          })
          .bindPopup(buildSensorPopupHtml(sensor, statusColor, statusLabel), {
            className: 'cs-map-popup-wrapper',
            maxWidth: 290,
            offset: [0, -16],
          })
          .addTo(sg);
      });
    }
  }, [sensors, dangerZones, activeLayers, zoom]);

  // When an incident is selected from outside the map (e.g. the sidebar
  // feed), fly to it and — once individual markers exist at that zoom —
  // open its popup, same as if the user had clicked it directly.
  useEffect(() => {
    const map = mapRef.current;
    if (!selectedIncident || !map) return;

    map.flyTo([selectedIncident.lat, selectedIncident.lng], 16, { duration: 0.8 });

    const timer = setTimeout(() => {
      markersById.current.get(selectedIncident.id)?.openPopup();
    }, 900);
    return () => clearTimeout(timer);
  }, [selectedIncident]);

  const LAYER_LABELS: Record<string, string> = {
    all: 'Усі об\'єкти',
    sensors: 'Датчики 📡',
    air: 'Якість повітря 🍃',
    water: 'Якість води 💧',
    weather: 'Погодні ризики ❄️',
    zones: 'Небезпечні зони ⚠️',
    incidents: 'Повідомлення 📋',
  };

  const handleLayerToggle = (key: string) => {
    setActiveLayers(prev => {
      let next = { ...prev, [key]: !prev[key] };
      if (key === 'all') {
        const val = !prev.all;
        next = {
          all: val,
          sensors: val,
          air: val,
          water: val,
          weather: val,
          zones: val,
          incidents: val,
        };
      } else {
        const otherKeys = ['sensors', 'air', 'water', 'weather', 'zones', 'incidents'];
        const allOn = otherKeys.every(k => next[k]);
        next.all = allOn;
      }
      return next;
    });
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Layer Switcher */}
      <div
        className="cs-glass-card"
        style={{
          position: 'absolute',
          top: 56,
          right: 56,
          padding: '12px 14px',
          zIndex: 1000,
          width: '180px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          background: 'var(--bg-card)',
          backdropFilter: 'blur(16px)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: 4 }}>
          🗺️ Шари карти
        </div>
        {Object.entries(LAYER_LABELS).map(([layerKey, label]) => {
          const isActive = activeLayers[layerKey];
          return (
            <label
              key={layerKey}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 11,
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                userSelect: 'none',
                padding: '2px 0',
              }}
            >
              <input
                type="checkbox"
                checked={isActive}
                onChange={() => handleLayerToggle(layerKey)}
                style={{
                  accentColor: 'var(--accent)',
                  cursor: 'pointer',
                }}
              />
              {label}
            </label>
          );
        })}
      </div>

      {/* Legend */}
      <div
        className="cs-glass-card cs-map-legend cs-desktop-only"
        style={{
          position: 'absolute',
          bottom: 20,
          right: 56,
          left: 'auto',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          zIndex: 1000,
          background: 'var(--bg-card)',
          backdropFilter: 'blur(16px)',
          boxShadow: 'var(--shadow-card)',
        }}
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
        className="cs-glass-card"
        style={{
          position: 'absolute',
          top: 16,
          right: 56,
          padding: '6px 12px',
          fontSize: 11,
          zIndex: 1000,
          color: 'var(--text-muted)',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(16px)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {zoom < ZOOM_SINGLE_CLUSTER ? '🔵 Загальний кластер' : zoom >= ZOOM_INDIVIDUAL ? '📍 Окремі маркери' : `🔢 Кластери (zoom ${zoom})`}
      </div>
    </div>
  );
};

export default CityMap;
