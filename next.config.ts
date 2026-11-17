import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 개발 모드 'N' 표시기가 모바일 하단 탭(홈)을 가려 비활성화 — 런타임 오류 오버레이는 그대로 표시됨
  devIndicators: false,
  // E2E 테스트는 별도 폴더에 빌드 → 실행 중인 개발 서버(.next)와 충돌하지 않음
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // 일부 브라우저가 기본으로 요청하는 /favicon.ico → app/icon.svg
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/icon.svg" }];
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "places.googleapis.com" }],
  },
};

export default nextConfig;
