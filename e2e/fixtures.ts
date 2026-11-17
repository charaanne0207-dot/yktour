import { test as base, expect, type Page } from "@playwright/test";

const EXTERNAL = /open-meteo|openstreetmap|wikimedia|googleapis|gstatic|fonts\./i;

type Guard = { appErrors: string[]; externalErrors: string[] };

/** 모든 테스트: 앱 콘솔 오류·페이지 예외·동일 출처 요청 실패가 있으면 실패 처리 */
/** 테스트가 일부러 방문하는 404 경로 */
const expected404 = ["/paris", "/rome/place/rome-nowhere"];

export const test = base.extend<{ guard: Guard }>({
  guard: [
    async ({ page }, use, testInfo) => {
      const g: Guard = { appErrors: [], externalErrors: [] };
      page.on("pageerror", (e) => g.appErrors.push(`pageerror: ${e.message}`));
      page.on("console", (m) => {
        if (m.type() !== "error") return;
        const text = `${m.text()} @ ${m.location().url}`;
        if (expected404.some((u) => text.includes("status of 404") && text.includes(u))) return; // 의도적 404 방문
        (EXTERNAL.test(text) ? g.externalErrors : g.appErrors).push(text.slice(0, 200));
      });
      page.on("requestfailed", (r) => {
        const f = r.failure()?.errorText ?? "";
        if (f.includes("ERR_ABORTED")) return; // 화면 이동으로 취소된 prefetch
        const line = `requestfailed ${f} ${r.url().slice(0, 120)}`;
        (EXTERNAL.test(r.url()) ? g.externalErrors : g.appErrors).push(line);
      });
      page.on("response", (r) => {
        if (r.status() >= 500 && r.url().includes("localhost")) g.appErrors.push(`HTTP ${r.status()} ${r.url()}`);
      });
      await use(g);
      if (g.externalErrors.length) testInfo.annotations.push({ type: "external-network", description: g.externalErrors.join(" | ").slice(0, 400) });
      expect(g.appErrors, "앱 콘솔/네트워크 오류").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

export const isMobile = (page: Page) => (page.viewportSize()?.width ?? 1000) < 768;

/** 현재 보이는 주 메뉴 (모바일 하단 탭 / 데스크톱 사이드바) */
export const mainNav = (page: Page) => page.getByRole("navigation", { name: "주 메뉴" }).locator("visible=true");

export async function noHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, `가로 스크롤 ${overflow}px`).toBeLessThanOrEqual(1);
}

/** 장소 상세에서 저장 (사진 위 하트) */
export async function savePlace(page: Page, id: string, opts: { must?: boolean } = {}) {
  await page.goto(`/rome/place/${id}`);
  const name = (await page.locator("h1").innerText()).trim();
  const heart = page.getByRole("button", { name: `${name} 저장` });
  if (await heart.isVisible()) await heart.click();
  if (opts.must) await page.getByRole("button", { name: "필수로 지정" }).locator("visible=true").click();
  return name;
}
