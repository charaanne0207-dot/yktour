import type { LatLng, Place } from "@/types";

/** API 키 없이도 동작하는 Google 지도 딥링크 */
export const googleMapsPlaceUrl = (p: Place) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.name.local} ${p.location.address}`)}` +
  (p.googlePlaceId ? `&query_place_id=${p.googlePlaceId}` : "");

export function googleMapsDirectionsUrl(stops: LatLng[], mode: "walking" | "transit" = "walking") {
  if (stops.length < 2) return null;
  const fmt = (s: LatLng) => `${s.lat},${s.lng}`;
  const params = new URLSearchParams({
    api: "1",
    origin: fmt(stops[0]),
    destination: fmt(stops[stops.length - 1]),
    travelmode: mode,
  });
  const mid = stops.slice(1, -1);
  if (mid.length) params.set("waypoints", mid.map(fmt).join("|"));
  return `https://www.google.com/maps/dir/?${params}`;
}
