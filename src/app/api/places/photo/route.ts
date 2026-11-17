import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/config/env";

// Places 사진 프록시 — API 키를 노출하지 않고 사진 URL 로 리다이렉트
export async function GET(req: Request) {
  const name = new URL(req.url).searchParams.get("name");
  const key = serverEnv().googlePlacesKey;
  if (!key) return NextResponse.json({ error: "demo_mode" }, { status: 501 });
  if (!name || !/^places\/[^/]+\/photos\/[^/]+$/.test(name)) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const res = await fetch(`https://places.googleapis.com/v1/${name}/media?maxWidthPx=1200&skipHttpRedirect=true&key=${key}`, {
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!res.ok) return NextResponse.json({ error: `places_${res.status}` }, { status: 502 });
  const { photoUri } = await res.json();
  return NextResponse.redirect(photoUri, { headers: { "Cache-Control": "public, max-age=86400" } });
}
