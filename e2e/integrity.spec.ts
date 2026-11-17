import { expect, test } from "./fixtures";

// 링크·API·데이터 무결성 (데스크톱 프로젝트에서만 1회)
test.beforeEach(({}, info) => test.skip(info.project.name !== "desktop", "1회만 실행"));

test("내부 링크 전수 확인 (404 없음)", async ({ page, request }) => {
  const seen = new Set<string>();
  for (const p of ["/rome", "/rome/explore", "/rome/saved", "/rome/itinerary", "/rome/map", "/rome/trip"]) {
    await page.goto(p);
    for (const href of await page.locator('a[href^="/"]').evaluateAll((as) => as.map((a) => a.getAttribute("href")!))) seen.add(href.split("#")[0]);
  }
  const bad: string[] = [];
  for (const href of seen) {
    const r = await request.get(href);
    if (r.status() >= 400) bad.push(`${r.status()} ${href}`);
  }
  expect(bad).toEqual([]);
  expect(seen.size).toBeGreaterThan(20);
});

test("모든 장소 상세 페이지 렌더링", async ({ page }) => {
  await page.goto("/rome/explore");
  const hrefs = await page.locator("article h3 a").evaluateAll((as) => as.map((a) => a.getAttribute("href")!));
  expect(hrefs.length).toBeGreaterThanOrEqual(25);
  for (const h of hrefs) {
    const r = await page.goto(h);
    expect(r?.status(), h).toBe(200);
    await expect(page.locator("h1")).not.toBeEmpty();
    await expect(page.getByRole("heading", { name: "운영시간" })).toBeVisible();
  }
});

test("API 오류 처리", async ({ request }) => {
  expect((await request.get("/api/places/rome-nowhere")).status()).toBe(404);
  const demo = await request.get("/api/places/rome-pantheon");
  expect(demo.status()).toBe(200);
  expect(["demo", "live"]).toContain((await demo.json()).mode);
  const photo = await request.get("/api/places/photo?name=../../etc");
  expect([400, 501]).toContain(photo.status());
  const status = await (await request.get("/api/status")).json();
  expect(status).toHaveProperty("googleMaps");
  expect(JSON.stringify(status)).not.toMatch(/AIza|sk-ant/); // 키 노출 금지
});
