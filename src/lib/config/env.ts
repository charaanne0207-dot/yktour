// 환경변수 접근은 이 파일로 일원화한다. (.env.example 참고)

/** 브라우저에서 사용 가능한 공개 설정 */
export const publicEnv = {
  googleMapsKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
  googleMapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || "DEMO_MAP_ID",
};

/** 서버 전용 설정 — 클라이언트 컴포넌트에서 import 금지 */
export const serverEnv = () => ({
  googlePlacesKey: process.env.GOOGLE_PLACES_API_KEY ?? "",
  anthropicKey: process.env.ANTHROPIC_API_KEY ?? "",
  anthropicModel: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
});

export const features = {
  map: () => Boolean(publicEnv.googleMapsKey),
};
