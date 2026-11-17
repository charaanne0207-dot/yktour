"use client";

import { useEffect } from "react";
import { AdvancedMarker, APIProvider, Map, Pin, useMap } from "@vis.gl/react-google-maps";
import type { LatLng } from "@/types";
import { publicEnv } from "@/lib/config/env";
import type { MapCanvasProps } from "./types";

function PathLine({ path }: { path: LatLng[] }) {
  const map = useMap();
  useEffect(() => {
    if (!map || path.length < 2) return;
    const line = new google.maps.Polyline({
      path,
      strokeOpacity: 0,
      icons: [{ icon: { path: "M 0,-1 0,1", strokeOpacity: 1, strokeColor: "#231d19", scale: 3 }, offset: "0", repeat: "14px" }],
      map,
    });
    return () => line.setMap(null);
  }, [map, path]);
  return null;
}

function FitBounds({ points }: { points: LatLng[] }) {
  const map = useMap();
  const sig = points.map((p) => `${p.lat},${p.lng}`).join("|");
  useEffect(() => {
    if (!map || points.length < 2) return;
    const b = new google.maps.LatLngBounds();
    points.forEach((p) => b.extend(p));
    map.fitBounds(b, 48);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, sig]);
  return null;
}

function PanTo({ target }: { target?: LatLng }) {
  const map = useMap();
  useEffect(() => {
    if (map && target) map.panTo(target);
  }, [map, target?.lat, target?.lng]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function GoogleCanvas({ center, zoom, markers, path, lodging, selectedId, onSelect }: MapCanvasProps) {
  const sel = markers.find((m) => m.id === selectedId);
  return (
    <APIProvider apiKey={publicEnv.googleMapsKey} language="ko">
      <Map defaultCenter={center} defaultZoom={zoom} mapId={publicEnv.googleMapId} gestureHandling="greedy">
        <FitBounds points={[...markers.map((m) => m.position), ...(lodging ? [lodging] : [])]} />
        {path && <PathLine path={path} />}
        {lodging && (
          <AdvancedMarker position={lodging} title={`숙소: ${lodging.name}`}>
            <Pin background="#2b2420" borderColor="#fff" glyphColor="#fff" glyph="H" />
          </AdvancedMarker>
        )}
        {markers.map((m) => (
          <AdvancedMarker key={m.id} position={m.position} title={m.title} onClick={() => onSelect(m.id)}>
            <Pin background={m.color} borderColor="#fff" glyphColor="#fff" glyph={m.label} scale={m.id === selectedId ? 1.25 : 1} />
          </AdvancedMarker>
        ))}
        <PanTo target={sel?.position} />
      </Map>
    </APIProvider>
  );
}
