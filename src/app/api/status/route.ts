import { NextResponse } from "next/server";
import { publicEnv, serverEnv } from "@/lib/config/env";

// 외부 연동 설정 여부 확인용 (키 값은 노출하지 않음)
export function GET() {
  const s = serverEnv();
  return NextResponse.json({
    googleMaps: Boolean(publicEnv.googleMapsKey),
    googlePlaces: Boolean(s.googlePlacesKey),
    claude: Boolean(s.anthropicKey),
  });
}
