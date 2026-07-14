import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../context/ThemeContext';

const TILE_DARK  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_LIGHT = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

interface LocationPickerProps {
  lat: number;
  lng: number;
  zoom?: number;
  onChange: (lat: number, lng: number) => void;
}

// Small embeddable map used in the report form so the user can click (or
// drag the pin) to mark the exact spot of the problem, instead of it being
// randomly placed near the city center.
const LocationPicker: React.FC<LocationPickerProps> = ({ lat, lng, zoom = 14, onChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);
  const { isDark } = useTheme();

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { attributionControl: false }).setView([lat, lng], zoom);
    const tile = L.tileLayer(isDark ? TILE_DARK : TILE_LIGHT, { maxZoom: 19 }).addTo(map);
    tileRef.current = tile;

    const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      onChange(pos.lat, pos.lng);
    });
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      onChange(e.latlng.lat, e.latlng.lng);
    });

    markerRef.current = marker;
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { tileRef.current?.setUrl(isDark ? TILE_DARK : TILE_LIGHT); }, [isDark]);

  // Re-center when lat/lng change externally (e.g. city switched) without
  // fighting the user's own clicks/drags mid-interaction.
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    const current = markerRef.current.getLatLng();
    if (Math.abs(current.lat - lat) > 1e-6 || Math.abs(current.lng - lng) > 1e-6) {
      markerRef.current.setLatLng([lat, lng]);
      mapRef.current.setView([lat, lng], mapRef.current.getZoom());
    }
  }, [lat, lng]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
};

export default LocationPicker;
