import { defineConfig, devices } from "@playwright/test";

// E2E: 프로덕션 빌드(`npm run build`)를 3123 포트에서 띄워 테스트. 시스템 Chrome 사용(브라우저 별도 다운로드 없음)
const PORT = 3123;

export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  workers: 2,
  retries: 0,
  reporter: [["list"], ["json", { outputFile: "e2e/.results/results.json" }]],
  outputDir: "e2e/.results/artifacts",
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: "chrome",
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"], channel: "chrome" } },
    { name: "desktop", use: { viewport: { width: 1366, height: 860 } } },
  ],
  webServer: {
    // 개발 서버(.next)와 분리된 .next-e2e 에 빌드 후 실행
    command: `npm run build && npm run start -- -p ${PORT}`,
    env: { NEXT_DIST_DIR: ".next-e2e" },
    url: `http://localhost:${PORT}/rome`,
    reuseExistingServer: true,
    timeout: 240_000,
  },
});
