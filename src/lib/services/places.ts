// 장소 서비스 — 로컬 큐레이션 데이터 + (키가 있으면) Google Places API (New) 보강
import type { Category, CityId, Place, Tier } from "@/types";
import { getCityPlaces, getPlaceById } from "@/data/cities";
import { TIER_ORDER } from "@/lib/labels";
import { isOpenOnDate } from "@/lib/time/openingHours";

export interface PlaceFilter {
  query?: string;
  categories?: Category[];
  tiers?: Tier[];
  openOn?: string; // YYYY-MM-DD
  indoorOnly?: boolean;
}

export const placesService = {
  list(cityId: CityId, f: PlaceFilter = {}): Place[] {
    const q = f.query?.trim().toLowerCase();
    return getCityPlaces(cityId)
      .filter((p) => !f.categories?.length || f.categories.includes(p.category))
      .filter((p) => !f.tiers?.length || f.tiers.includes(p.tier))
      .filter((p) => !f.indoorOnly || p.indoor)
      .filter((p) => !f.openOn || isOpenOnDate(p.openingHours, f.openOn))
      .filter(
        (p) =>
          !q ||
          [p.name.ko, p.name.en, p.name.local, p.location.area, ...p.tags].some((s) => s.toLowerCase().includes(q)),
      )
      .sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier));
  },
  get: (id: string) => getPlaceById(id),
  byTier: (cityId: CityId, tier: Tier) => getCityPlaces(cityId).filter((p) => p.tier === tier),
};

/** 클라이언트에 전달하는 Google 보강 정보 (키 값은 포함하지 않음) */
export interface GoogleEnrichment {
  placeId: string;
  displayName?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  weekdayDescriptions?: string[];
  googleMapsUri?: string;
  photos: { name: string; attributions: { displayName: string; uri?: string }[] }[];
  fetchedAt: string;
}

const FIELDS = [
  "id",
  "displayName",
  "rating",
  "userRatingCount",
  "priceLevel",
  "regularOpeningHours.weekdayDescriptions",
  "photos",
  "googleMapsUri",
];

/** Google Places API (New) — 서버 전용. placeId 가 없으면 Text Search 로 매칭 */
export async function fetchGoogleEnrichment(place: Place, apiKey: string): Promise<GoogleEnrichment | null> {
  if (!apiKey) return null;
  const headers = { "X-Goog-Api-Key": apiKey, "Content-Type": "application/json" };
  const revalidate = { next: { revalidate: 60 * 60 * 24 * 7 } };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any;
  if (place.googlePlaceId) {
    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(place.googlePlaceId)}?languageCode=ko`, {
      headers: { ...headers, "X-Goog-FieldMask": FIELDS.join(",") },
      ...revalidate,
    });
    if (!res.ok) throw new Error(`Places Details ${res.status}`);
    data = await res.json();
  } else {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: { ...headers, "X-Goog-FieldMask": FIELDS.map((f) => `places.${f}`).join(",") },
      body: JSON.stringify({
        textQuery: `${place.name.local} ${place.location.address} Roma`,
        languageCode: "ko",
        maxResultCount: 1,
        locationBias: { circle: { center: { latitude: place.location.lat, longitude: place.location.lng }, radius: 500 } },
      }),
      ...revalidate,
    });
    if (!res.ok) throw new Error(`Places Text Search ${res.status}`);
    data = (await res.json()).places?.[0];
    if (!data) return null;
  }

  return {
    placeId: data.id,
    displayName: data.displayName?.text,
    rating: data.rating,
    userRatingCount: data.userRatingCount,
    priceLevel: data.priceLevel,
    weekdayDescriptions: data.regularOpeningHours?.weekdayDescriptions,
    googleMapsUri: data.googleMapsUri,
    photos: (data.photos ?? []).slice(0, 5).map((p: { name: string; authorAttributions?: { displayName: string; uri?: string }[] }) => ({
      name: p.name,
      attributions: p.authorAttributions ?? [],
    })),
    fetchedAt: new Date().toISOString(),
  };
}
