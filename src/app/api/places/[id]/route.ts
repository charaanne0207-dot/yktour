import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/config/env";
import { fetchGoogleEnrichment, placesService } from "@/lib/services/places";

// 로컬 장소 + Google Places 보강 정보. 키가 없으면 mode: "demo"
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const place = placesService.get(id);
  if (!place) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const key = serverEnv().googlePlacesKey;
  if (!key) return NextResponse.json({ mode: "demo", google: null });

  try {
    const google = await fetchGoogleEnrichment(place, key);
    return NextResponse.json({ mode: "live", google });
  } catch (e) {
    return NextResponse.json({ mode: "error", google: null, error: e instanceof Error ? e.message : "unknown" }, { status: 502 });
  }
}
