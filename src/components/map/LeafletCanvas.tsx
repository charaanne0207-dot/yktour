"use client";

// API 키 없이 동작하는 OpenStreetMap 지도 (Leaflet). next/dynamic(ssr:false)로만 로드.
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import type { MapCanvasProps } from "./types";

const pinIcon = (color: string, label?: string, active?: boolean) =>
  L.divIcon({
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<div style="width:28px;height:28px;border-radius:9999px;background:${color};color:#fff;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;font:600 12px system-ui;${active ? "transform:scale(1.3);outline:3px solid rgba(35,29,25,.85)" : ""}">${label ?? ""}</div>`,
  });

const lodgingIcon = L.divIcon({
  className: "",
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  html: `<div style="width:30px;height:30px;border-radius:8px;background:#2b2420;color:#fff;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font:700 13px system-ui">H</div>`,
});

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  const sig = points.map((p) => p.join(",")).join("|");
  useEffect(() => {
    // 애니메이션 없이 이동 — 화면 전환 중 지도가 제거될 때 '_leaflet_pos' 오류 방지
    if (points.length > 1) map.fitBounds(points, { padding: [40, 40], maxZoom: 16, animate: false });
    else if (points.length === 1) map.setView(points[0], 15, { animate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, sig]);
  return null;
}

export default function LeafletCanvas({ center, zoom, markers, path, lodging, selectedId, onSelect }: MapCanvasProps) {
  const points: [number, number][] = [
    ...markers.map((m) => [m.position.lat, m.position.lng] as [number, number]),
    ...(lodging ? [[lodging.lat, lodging.lng] as [number, number]] : []),
  ];
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={zoom} className="size-full" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={points} />
      {path && path.length > 1 && (
        <Polyline positions={path.map((p) => [p.lat, p.lng])} pathOptions={{ color: "#231d19", weight: 3, opacity: 0.75, dashArray: "2 8", lineCap: "round" }} />
      )}
      {lodging && (
        <Marker position={[lodging.lat, lodging.lng]} icon={lodgingIcon}>
          <Popup>숙소: {lodging.name}</Popup>
        </Marker>
      )}
      {markers.map((m) => (
        <Marker
          key={m.id}
          position={[m.position.lat, m.position.lng]}
          icon={pinIcon(m.color, m.label, m.id === selectedId)}
          zIndexOffset={m.id === selectedId ? 1000 : 0}
          title={m.title}
          eventHandlers={{ click: () => onSelect(m.id) }}
        />
      ))}
      <PanTo target={markers.find((m) => m.id === selectedId)?.position} />
    </MapContainer>
  );
}

/** 목록에서 선택한 장소로 지도 이동 */
function PanTo({ target }: { target?: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.panTo([target.lat, target.lng], { animate: true });
    return () => {
      map.stop(); // 언마운트·연속 선택 시 진행 중인 팬 애니메이션 중단
    };
  }, [map, target?.lat, target?.lng]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
