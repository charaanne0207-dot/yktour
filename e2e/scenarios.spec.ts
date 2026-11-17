import { expect, isMobile, mainNav, noHorizontalScroll, savePlace, test } from "./fixtures";

// PRD 사용자 시나리오 1~10 (모바일·데스크톱 두 프로젝트에서 모두 실행)

test.describe("S1 홈·내비게이션", () => {
  test("홈 접속 후 모든 주요 화면으로 이동", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/rome$/);
    await expect(page.getByRole("heading", { level: 1, name: "로마" })).toBeVisible();
    await expect(page.getByText("My Trip")).toBeVisible();

    const targets: [string, RegExp, string | RegExp][] = [
      ["탐색", /\/rome\/explore$/, "탐색"],
      ["My Places", /\/rome\/saved$/, "My Places"],
      ["일정", /\/rome\/itinerary$/, "로마 일정"],
      ["지도", /\/rome\/map$/, "로마 지도"],
      ["홈", /\/rome$/, "로마"],
    ];
    for (const [label, url, heading] of targets) {
      await mainNav(page).getByRole("link", { name: label, exact: true }).click();
      await expect(page).toHaveURL(url);
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
      await expect(mainNav(page).getByRole("link", { name: label, exact: true })).toHaveAttribute("aria-current", "page");
    }
    // 여행 설정 진입
    await page.getByRole("link", { name: "여행 설정" }).locator("visible=true").first().click();
    await expect(page).toHaveURL(/\/rome\/trip$/);
  });

  test("준비 중 도시·없는 페이지 처리", async ({ page }) => {
    await page.goto("/venice");
    await expect(page.getByText("베네치아 큐레이션 준비 중")).toBeVisible();
    await page.goto("/venice/explore");
    await expect(page.getByText("아직 등록된 장소가 없습니다")).toBeVisible();
    const r1 = await page.goto("/paris");
    expect(r1?.status()).toBe(404);
    await expect(page.getByText("길을 잃으셨나요?")).toBeVisible();
    const r2 = await page.goto("/rome/place/rome-nowhere");
    expect(r2?.status()).toBe(404);
  });
});

test.describe("S2 검색·필터", () => {
  test("카테고리·검색·상세 필터·빈 결과", async ({ page }) => {
    await page.goto("/rome/explore");
    const cards = page.locator("article");
    const total = await cards.count();
    expect(total).toBeGreaterThanOrEqual(25);

    await page.getByRole("button", { name: "맛집", exact: true }).click();
    const food = await cards.count();
    expect(food).toBeGreaterThan(0);
    expect(food).toBeLessThan(total);
    for (const eyebrow of await cards.locator("p.eyebrow").allInnerTexts()) expect(eyebrow).toContain("맛집");

    await page.getByRole("button", { name: "전체", exact: true }).click();
    await page.getByPlaceholder("장소·지역·키워드 검색").fill("pantheon");
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText("판테온");

    await page.getByPlaceholder("장소·지역·키워드 검색").fill("존재하지않는장소");
    await expect(page.getByText("조건에 맞는 장소가 없어요")).toBeVisible();
    await page.getByRole("button", { name: "초기화" }).click();
    await expect(cards).toHaveCount(total);

    await page.getByRole("button", { name: "상세 필터" }).click();
    await page.getByRole("button", { name: "☔ 실내만" }).click();
    const indoor = await cards.count();
    expect(indoor).toBeGreaterThan(0);
    expect(indoor).toBeLessThan(total);
    // 일요일(1/31) 영업 필터: 다 엔초 알 29(일요일 휴무) 제외
    await page.getByRole("button", { name: "☔ 실내만" }).click();
    await page.getByLabel("이 날 영업하는 곳만").selectOption("2027-01-31");
    await expect(page.locator("article", { hasText: "다 엔초 알 29" })).toHaveCount(0);
    await expect(page.locator("article", { hasText: "바티칸 박물관" })).toHaveCount(1); // 마지막 일요일 예외 개방
    await noHorizontalScroll(page);
  });

  test("홈 카테고리 타일 → 필터 적용된 탐색", async ({ page }) => {
    await page.goto("/rome");
    await page.getByRole("link", { name: /카페\s*\d+곳/ }).click();
    await expect(page).toHaveURL(/category=cafe/);
    await expect(page.getByRole("button", { name: "카페", exact: true })).toHaveAttribute("aria-pressed", "true");
  });
});

test.describe("S3 장소 상세", () => {
  test("판테온: 사진·추천 이유·운영정보·팁·출처·예약", async ({ page }) => {
    await page.goto("/rome/place/rome-pantheon");
    await expect(page.getByRole("heading", { level: 1, name: "판테온" })).toBeVisible();
    await expect(page.getByText("Must Visit").first()).toBeVisible();
    await expect(page.getByText("검증 2026-11-17")).toBeVisible(); // 공식 출처 대조 완료 표시
    const img = page.locator("article img").first();
    await expect(img).toBeVisible();
    expect(await img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    await expect(page.getByText(/CC BY/).first()).toBeVisible(); // 사진 라이선스 표기
    await expect(page.getByRole("heading", { name: "방문 팁" })).toBeVisible();
    await expect(page.getByText("내 여행 날짜")).toBeVisible();
    await expect(page.getByText(/Day 1 · 1\/28/).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Direzione Musei Roma — Pantheon" })).toHaveAttribute("href", /cultura\.gov\.it/);
    await expect(page.getByText(/€7 \(2026\.7\.1 인상/).first()).toBeAttached();
    await expect(page.getByText(/DEMO · Google 평점 미연동|Google Places/)).toBeVisible();
    await expect(page.getByRole("link", { name: /지도 열기/ })).toHaveAttribute("href", /google\.com\/maps/);
  });

  test("입장료·공식/비공식 예약처", async ({ page }) => {
    await page.goto("/rome/place/rome-colosseum");
    const card = page.locator("section", { has: page.locator("#admission") });
    await expect(card).toContainText("€18");
    await expect(card).toContainText("복수 출처 보고");
    await expect(card.getByRole("link", { name: /ticketing\.colosseo\.it/ }).first()).toHaveAttribute("href", "https://ticketing.colosseo.it/");
    await expect(card.getByRole("link", { name: /GetYourGuide/ })).toHaveAttribute("href", /getyourguide\.com\/s\/\?q=Colosseum/);
    await expect(card.getByRole("link", { name: /Tiqets/ })).toHaveAttribute("href", /tiqets\.com\/en\/search\?q=Colosseum/);
    await expect(card).toContainText("수수료가 붙어");
    await expect(card).toContainText("공식 판매처는 ticketing.colosseo.it 뿐");
    // 무료 장소: 비공식 링크 없음
    await page.goto("/rome/place/rome-pincio");
    await expect(page.locator("section", { has: page.locator("#admission") })).toContainText("무료");
    await expect(page.getByRole("link", { name: /GetYourGuide/ })).toHaveCount(0);
    // 탐색 카드에 입장료 표시
    await page.goto("/rome/explore");
    await expect(page.locator("article", { has: page.getByRole("link", { name: "콜로세움", exact: true }) })).toContainText("입장 €18");
  });

  test("미검증 장소는 '검수 전'으로 명시", async ({ page }) => {
    await page.goto("/rome/place/rome-colosseum");
    await expect(page.getByText("운영정보 검수 전")).toBeVisible();
    await expect(page.getByText(/공식 확인 필요/)).toBeVisible(); // 출처 간 상충 안내
  });

  test("휴무일·예외 운영일을 여행 날짜별로 표시", async ({ page }) => {
    await page.goto("/rome/place/rome-da-enzo");
    await expect(page.locator("li", { hasText: "Day 4 · 1/31 (일)" })).toContainText("휴무");
    await page.goto("/rome/place/rome-vatican-museums");
    await expect(page.locator("li", { hasText: "Day 4 · 1/31 (일)" })).toContainText("09:00–14:00");
    await expect(page.getByText(/검증 2026-11-17/)).toBeVisible();
  });
});

test.describe("S4 북마크·Must Visit", () => {
  test("탐색에서 저장 → My Places 반영 → 필수 지정 → 삭제", async ({ page }) => {
    await page.goto("/rome/explore");
    await page.getByRole("button", { name: "콜로세움 저장" }).click();
    await expect(page.getByRole("button", { name: "콜로세움 저장 해제" })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "트레비 분수 저장" }).click();
    await expect(page.getByRole("link", { name: /2곳 저장/ })).toBeVisible(); // 하단 일정 만들기 바로가기

    await mainNav(page).getByRole("link", { name: "My Places", exact: true }).click();
    await expect(page.locator("main li", { hasText: "콜로세움" })).toBeVisible();
    await page.getByRole("button", { name: "콜로세움 필수 방문 지정" }).click();
    await expect(page.getByRole("button", { name: "콜로세움 필수 방문 해제" })).toBeVisible();
    await page.getByRole("button", { name: "📌 필수만" }).click();
    await expect(page.locator("main ul > li")).toHaveCount(1);
    await page.getByRole("button", { name: "📌 필수만" }).click();

    await page.getByRole("button", { name: "트레비 분수 저장 삭제" }).click();
    await expect(page.locator("main li", { hasText: "트레비 분수" })).toHaveCount(0);
    await page.getByRole("button", { name: "콜로세움 저장 삭제" }).click();
    await expect(page.getByText("아직 저장한 장소가 없어요")).toBeVisible();
  });
});

test.describe("S5 여행 설정", () => {
  test("날짜·숙소·취향·잘못된 입력", async ({ page }) => {
    await page.goto("/rome/trip");
    await page.getByLabel("도착").fill("2027-01-27");
    await page.getByLabel("출발").fill("2027-01-30");
    await page.getByRole("button", { name: /판테온·나보나/ }).click();
    await expect(page.getByText(/현재:\s*판테온·나보나/)).toBeVisible();

    // 잘못된 좌표 → 오류 메시지, 숙소 변경 안 됨
    await page.getByText("정확한 숙소 좌표 직접 입력").click();
    await page.getByLabel("숙소 이름").fill("Hotel Test");
    await page.getByLabel("위도").fill("abc");
    await page.getByLabel("경도").fill("12.48");
    await page.getByRole("button", { name: "저장", exact: true }).click();
    await expect(page.getByText(/시내 좌표\(위도·경도\)를 입력하세요/)).toBeVisible();
    await expect(page.getByText(/현재:\s*판테온·나보나/)).toBeVisible();
    // 로마에서 먼 좌표도 거부
    await page.getByLabel("위도").fill("37.56");
    await page.getByLabel("경도").fill("126.97");
    await page.getByRole("button", { name: "저장", exact: true }).click();
    await expect(page.getByText(/시내 좌표\(위도·경도\)를 입력하세요/)).toBeVisible();
    // 올바른 좌표
    await page.getByLabel("위도").fill("41.9009");
    await page.getByLabel("경도").fill("12.5016");
    await page.getByRole("button", { name: "저장", exact: true }).click();
    await expect(page.getByText(/현재:\s*Hotel Test/)).toBeVisible();

    await page.getByRole("button", { name: "미술" }).click();
    await page.getByRole("button", { name: /여유/ }).click();
    await expect(page.getByRole("button", { name: "미술" })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: /설정 완료/ }).click();
    await expect(page).toHaveURL(/\/rome\/explore/);
    await expect(page.getByText(/✓ 관심사 일치: .*미술/).first()).toBeVisible();

    await page.goto("/rome");
    await expect(page.getByText("1월 27일 – 1월 30일")).toBeVisible();
    await expect(page.getByText("Hotel Test")).toBeVisible();
  });
});

test.describe("S6~S8 일정 생성·지도·편집", () => {
  test("저장 장소로 일정 생성 → 검증 → 편집·재계산 → 지도", async ({ page }) => {
    await page.goto("/rome/trip");
    await page.getByRole("button", { name: /몬티/ }).click();
    await savePlace(page, "rome-colosseum", { must: true });
    await savePlace(page, "rome-vatican-museums", { must: true });
    await savePlace(page, "rome-borghese");
    await savePlace(page, "rome-da-enzo");

    await page.goto("/rome/itinerary");
    await expect(page.getByText("동선을 자동으로 짜 드릴게요")).toBeVisible();
    await page.getByRole("button", { name: "일정 자동 생성" }).click();
    await expect(page.getByRole("status")).toContainText(/곳으로 4일 일정을 만들었어요/);

    const tabs = page.getByRole("tab");
    await expect(tabs).toHaveCount(4);

    // 필수 방문지 포함 + 방문 불가(휴무·영업 종료) 경고 0
    const allNames: string[] = [];
    for (let i = 0; i < 4; i++) {
      await tabs.nth(i).click();
      const timeline = page.locator("main ol").first();
      allNames.push(...(await timeline.locator("a.font-serif").allInnerTexts()));
      await expect(page.getByText(/방문 불가:/)).toHaveCount(0);
      // 점심·저녁 각 1회
      await expect(page.getByText(/점심/).first()).toBeVisible();
      await expect(page.getByText(/저녁/).first()).toBeVisible();
    }
    expect(allNames).toContain("콜로세움");
    expect(allNames).toContain("바티칸 박물관 & 시스티나 성당");
    expect(new Set(allNames).size).toBe(allNames.length); // 중복 없음

    // 다 엔초(일요일 휴무)가 Day 4(일)에 없어야 함
    await tabs.nth(3).click();
    await expect(page.locator("main ol a.font-serif", { hasText: "다 엔초 알 29" })).toHaveCount(0);

    // 편집: 순서 변경 → 시각 재계산
    await tabs.nth(0).click();
    const times = () => page.locator("main ol p.text-xs.font-semibold").allInnerTexts();
    const before = await times();
    await page.getByRole("button", { name: "아래로 이동" }).first().click();
    await expect.poll(times).not.toEqual(before);

    // 예약 시각 충돌 → 경고
    await page.getByRole("button", { name: /편집$/ }).nth(1).click();
    await page.locator('input[type="time"]').first().fill("07:00");
    await expect(page.getByText(/시간 충돌: 예약 07:00/)).toBeVisible();
    await page.locator('input[type="time"]').first().fill("");
    await expect(page.getByText(/시간 충돌/)).toHaveCount(0);

    // 삭제
    const countBefore = await page.getByRole("button", { name: "아래로 이동" }).count();
    await page.getByRole("button", { name: /^삭제$/ }).click();
    await expect(page.getByRole("button", { name: "아래로 이동" })).toHaveCount(countBefore - 1);

    // 식사 슬롯 추가 + 근처 식당 추천
    await page.getByRole("button", { name: "점심 슬롯" }).click();
    await expect(page.getByText("점심 · 주변 식당 자유").last()).toBeVisible();

    // 다른 날로 이동
    await page.getByRole("button", { name: /편집$/ }).first().click();
    const movedName = await page.locator("main ol a.font-serif").first().innerText();
    await page.getByLabel("다른 날로").selectOption({ index: 2 });
    await tabs.nth(2).click();
    await expect(page.locator("main ol a.font-serif", { hasText: movedName })).toHaveCount(1);

    // 비 오는 날 → 실내 대안 제안
    await tabs.nth(1).click();
    await page.getByRole("button", { name: /비 예보/ }).click();
    await expect(page.getByText("☔ 비 오는 날: 야외 장소에 경고와 실내 대안이 표시됩니다.")).toBeVisible();

    // 지도: 날짜 딥링크·번호 마커·경로·길찾기
    await page.locator('main a[href*="/rome/map?day="]').click(); // 하루 요약 카드의 '지도'
    await expect(page).toHaveURL(/\/rome\/map\?day=2027-01-29/);
    await expect(page.getByRole("tab", { name: /Day 2/ })).toHaveAttribute("aria-selected", "true");
    const listCount = await page.locator("[data-id]").count();
    expect(listCount).toBeGreaterThan(0);
    await expect(page.locator(".leaflet-marker-icon")).toHaveCount(listCount + 1); // + 숙소
    await expect(page.locator("path.leaflet-interactive")).toHaveCount(1); // 간이 동선
    await expect(page.getByText(/간이 동선\(직선\)/)).toBeVisible();
    const dir = await page.getByRole("link", { name: /실제 경로 길찾기/ }).getAttribute("href");
    expect(dir).toMatch(/google\.com\/maps\/dir\/\?api=1.*waypoints=/);
    await page.locator("[data-id] button").nth(1).click();
    await expect(page.getByRole("link", { name: /상세 보기/ })).toBeVisible();
    await page.getByRole("button", { name: "미리보기 닫기" }).click();
    await expect(page.getByRole("link", { name: /상세 보기/ })).toHaveCount(0);
  });

  test("상세 화면에서 일정에 추가 (휴무일 안내)", async ({ page }) => {
    await page.goto("/rome/place/rome-da-enzo");
    const bar = page.getByLabel("일정 날짜 선택").locator("visible=true");
    await bar.first().selectOption("2027-01-31");
    await expect(page.getByText("이 날은 휴무입니다 — 다른 날을 선택하세요.").first()).toBeVisible();
    await bar.first().selectOption("2027-01-28");
    await page.getByRole("button", { name: "일정에 추가" }).locator("visible=true").first().click();
    await expect(page.getByRole("button", { name: "추가됨" }).locator("visible=true").first()).toBeDisabled();
    await page.goto("/rome/itinerary");
    await expect(page.locator("main ol a.font-serif", { hasText: "다 엔초 알 29" })).toBeVisible();
  });
});

test.describe("S5b 날짜 변경 보호", () => {
  test("기간을 줄이면 사라질 일정 수를 확인받음", async ({ page }) => {
    await page.goto("/rome/itinerary");
    await page.getByRole("button", { name: "일정 자동 생성" }).click();
    await page.goto("/rome/trip");
    let message = "";
    page.once("dialog", (d) => { message = d.message(); d.dismiss(); });
    await page.getByLabel("출발").fill("2027-01-29");
    await expect.poll(() => message).toMatch(/일정 \d+개가 삭제됩니다/);
    await expect(page.getByLabel("출발")).toHaveValue("2027-01-31"); // 취소 → 유지
  });
});

test.describe("S9 저장·복원", () => {
  test("새로고침 후 유지 + 백업 내보내기/가져오기 + 잘못된 파일", async ({ page }) => {
    await savePlace(page, "rome-pantheon", { must: true });
    await page.goto("/rome/itinerary");
    await page.getByRole("button", { name: "일정 자동 생성" }).click();
    const firstDay = await page.locator("main ol a.font-serif").allInnerTexts();

    await page.reload();
    await expect(page.locator("main ol a.font-serif").first()).toBeVisible();
    expect(await page.locator("main ol a.font-serif").allInnerTexts()).toEqual(firstDay);
    await page.goto("/rome/saved");
    await expect(page.getByRole("button", { name: "판테온 필수 방문 해제" })).toBeVisible();

    // 내보내기
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "내보내기" }).click()]);
    const path = await download.path();
    const fs = await import("node:fs");
    const json = JSON.parse(fs.readFileSync(path!, "utf-8"));
    expect(json.app).toBe("ciao-ai");
    expect(Object.keys(json.saved)).toContain("rome-pantheon");

    // 초기화 후 가져오기 → 복원
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.getByText("아직 저장한 장소가 없어요")).toBeVisible();
    await page.locator('input[type="file"]').setInputFiles({ name: "b.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(json)) });
    await expect(page.getByText("복원했습니다.")).toBeVisible();
    await expect(page.getByRole("button", { name: "판테온 필수 방문 해제" })).toBeVisible();

    // 잘못된 파일
    await page.locator('input[type="file"]').setInputFiles({ name: "x.json", mimeType: "application/json", buffer: Buffer.from('{"hello":1}') });
    await expect(page.getByText("Ciao, AI! 백업 파일이 아닙니다.")).toBeVisible();
    await page.locator('input[type="file"]').setInputFiles({ name: "y.json", mimeType: "application/json", buffer: Buffer.from("not json") });
    await expect(page.getByRole("status")).toContainText(/JSON|Unexpected|파일/);
  });
});

test.describe("S10 반응형·접근성", () => {
  const pages = ["/rome", "/rome/explore", "/rome/place/rome-colosseum", "/rome/saved", "/rome/itinerary", "/rome/map", "/rome/trip", "/venice"];

  test("가로 스크롤 없음 + 레이아웃 요소", async ({ page }) => {
    for (const p of pages) {
      await page.goto(p);
      await noHorizontalScroll(page);
    }
    await page.goto("/rome");
    if (isMobile(page)) {
      const nav = mainNav(page);
      await expect(nav).toBeVisible();
      // 하단 탭 터치 영역 ≥ 44px
      for (const box of await nav.getByRole("link").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height)))
        expect(box).toBeGreaterThanOrEqual(44);
    } else {
      await expect(page.locator("aside")).toBeVisible();
    }
  });

  test("상세 화면 하단 액션 바가 탭 바와 겹치지 않음 (모바일)", async ({ page }) => {
    test.skip(!isMobile(page), "모바일 전용");
    await page.goto("/rome/place/rome-colosseum");
    const bar = await page.getByRole("button", { name: "일정에 추가" }).locator("visible=true").first().boundingBox();
    const nav = await mainNav(page).boundingBox();
    expect(bar && nav && bar.y + bar.height <= nav.y).toBeTruthy();
  });

  test("이미지 로드 실패 없음 (탐색 전체 스크롤)", async ({ page }) => {
    await page.goto("/rome/explore");
    for (let y = 0; y < 12; y++) {
      await page.mouse.wheel(0, 900);
      await page.waitForTimeout(150);
    }
    await page.waitForLoadState("networkidle").catch(() => {});
    const broken = await page.locator("article img").evaluateAll((imgs) =>
      (imgs as HTMLImageElement[]).filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src),
    );
    expect(broken).toEqual([]);
  });
});
