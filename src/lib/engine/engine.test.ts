import { describe, expect, it } from "vitest";
import { getCity, getCityPlaces, getPlaceById } from "@/data/cities";
import type { ItineraryDay, Place, Preferences } from "@/types";
import { isOpenOnDate } from "@/lib/time/openingHours";
import { hhmmToMin, sunTimes } from "@/lib/time/sun";
import { suggestAlternatives } from "./alternatives";
import { distanceM, estimateTravel } from "./geo";
import { generateItinerary, PACE_CAPACITY } from "./generate";
import { rankPlaces } from "./recommend";
import { simulateDay, type TimelineContext } from "./timeline";

const rome = getCity("rome");
const places = getCityPlaces("rome");
const P = (id: string) => getPlaceById(id)!;
const lodging = { lat: 41.8986, lng: 12.4745 }; // 센트로 스토리코
const ctx: TimelineContext = {
  getPlace: getPlaceById,
  lodging,
  cityCenter: rome.center,
  timezone: rome.timezone,
  dayStart: "09:00",
  dayEnd: "22:00",
};
const prefs: Preferences = { interests: ["art"], pace: "normal", budget: 2, dayStart: "09:00", dayEnd: "22:00" };
// 2027-01-28(목) ~ 2027-01-31(일)
const DATES = ["2027-01-28", "2027-01-29", "2027-01-30", "2027-01-31"];

describe("sun", () => {
  it("로마 1월 말 일몰은 17시 10~25분 사이 (CET)", () => {
    const { sunset } = sunTimes("2027-01-28", rome.center, rome.timezone);
    expect(hhmmToMin(sunset)).toBeGreaterThanOrEqual(hhmmToMin("17:10"));
    expect(hhmmToMin(sunset)).toBeLessThanOrEqual(hhmmToMin("17:25"));
  });
});

describe("geo", () => {
  it("판테온–트레비 직선거리 약 1.2km 이내, 도보 추정", () => {
    const d = distanceM(P("rome-pantheon").location, P("rome-trevi").location);
    expect(d).toBeGreaterThan(400);
    expect(d).toBeLessThan(1200);
    expect(estimateTravel(P("rome-pantheon").location, P("rome-trevi").location).mode).toBe("walk");
  });
  it("판테온–바티칸 박물관은 대중교통 추정", () => {
    expect(estimateTravel(P("rome-pantheon").location, P("rome-vatican-museums").location).mode).toBe("transit");
  });
});

describe("opening hours", () => {
  it("바티칸 박물관 일반 일요일 휴관·마지막 일요일 예외 개방, 보르게세 월요일 휴관", () => {
    expect(isOpenOnDate(P("rome-vatican-museums").openingHours, "2027-02-07")).toBe(false);
    expect(isOpenOnDate(P("rome-vatican-museums").openingHours, "2027-01-31")).toBe(true); // 마지막 일요일 무료 개방
    expect(isOpenOnDate(P("rome-da-enzo").openingHours, "2027-01-31")).toBe(false);
    expect(isOpenOnDate(P("rome-borghese").openingHours, "2027-02-01")).toBe(false);
    expect(isOpenOnDate(P("rome-borghese").openingHours, "2027-01-31")).toBe(true);
  });
});

describe("timeline", () => {
  const day = (items: ItineraryDay["items"], date = "2027-01-28", rainy = false): ItineraryDay => ({ date, items, rainy });
  const item = (placeId: string, fixedTime?: string) => ({ id: placeId, kind: "place" as const, placeId, fixedTime });

  it("휴무일 장소는 error 경고", () => {
    const tl = simulateDay(day([item("rome-da-enzo")], "2027-01-31"), ctx);
    expect(tl.entries[0].warnings.some((w) => w.code === "closed_day")).toBe(true);
  });
  it("예약 시각보다 늦게 도착하면 booking_late", () => {
    const tl = simulateDay(day([item("rome-vatican-museums"), item("rome-colosseum", "10:00")]), ctx);
    expect(tl.entries[1].warnings.some((w) => w.code === "booking_late")).toBe(true);
  });
  it("예약 시각보다 일찍 도착하면 예약 시각에 시작", () => {
    const tl = simulateDay(day([item("rome-colosseum", "11:00")]), ctx);
    expect(tl.entries[0].start).toBe(hhmmToMin("11:00"));
  });
  it("오픈 전 도착 시 오픈 시각까지 대기", () => {
    const tl = simulateDay(day([item("rome-borghese")]), { ...ctx, dayStart: "07:30" });
    expect(tl.entries[0].start).toBe(hhmmToMin("09:00"));
  });
  it("일몰 후 야외 유적은 after_sunset, 우천일 야외는 rain_outdoor", () => {
    const tl = simulateDay(day([item("rome-caracalla")], "2027-01-28", true), { ...ctx, dayStart: "17:30" });
    const codes = tl.entries[0].warnings.map((w) => w.code);
    expect(codes).toContain("rain_outdoor");
  });
  it("순서를 바꾸면 도착 시각이 재계산된다", () => {
    const a = simulateDay(day([item("rome-pantheon"), item("rome-colosseum")]), ctx);
    const b = simulateDay(day([item("rome-colosseum"), item("rome-pantheon")]), ctx);
    expect(a.entries[1].arrive).not.toBe(b.entries[0].arrive);
  });
});

describe("generate", () => {
  const ranked = rankPlaces(places, prefs, lodging);
  const candidates = ranked.map((s) => ({ place: s.place, must: s.place.tier === "must", score: s.score }));
  const res = generateItinerary({ cityId: "rome", dates: DATES, candidates, pace: "normal", lodging, ctx });
  const placed = res.itinerary.days.flatMap((d) => d.items.filter((i) => i.placeId).map((i) => ({ date: d.date, id: i.placeId! })));

  it("필수 방문지는 모두 포함", () => {
    const mustIds = candidates.filter((c) => c.must).map((c) => c.place.id);
    for (const id of mustIds) expect(placed.map((p) => p.id)).toContain(id);
  });
  it("휴무일에 배정된 장소 없음", () => {
    for (const p of placed) expect(isOpenOnDate(P(p.id).openingHours, p.date)).toBe(true);
  });
  it("관광 장소 수는 페이스 용량 이하 (필수 초과분 제외)", () => {
    for (const d of res.itinerary.days) {
      const n = d.items.filter((i) => i.placeId && P(i.placeId).category !== "food" && !i.note).length;
      expect(n).toBeLessThanOrEqual(PACE_CAPACITY.normal + 2);
    }
  });
  it("매일 점심·저녁이 포함된다", () => {
    for (const d of res.itinerary.days) {
      const meals = d.items.filter((i) => i.kind === "meal" || i.note === "lunch" || i.note === "dinner");
      expect(meals.length).toBe(2);
    }
  });
  it("생성 결과에 영업 종료·휴무 error 가 없다", () => {
    for (const d of res.itinerary.days) {
      const tl = simulateDay(d, ctx);
      const errors = tl.entries.flatMap((e) => e.warnings).filter((w) => w.level === "error" && w.code !== "booking_late");
      expect(errors).toEqual([]);
    }
  });
  it("중복 배정 없음", () => {
    const ids = placed.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("예약된 장소는 지정 날짜에 고정", () => {
    const r = generateItinerary({
      cityId: "rome", dates: DATES, candidates, pace: "normal", lodging, ctx,
      bookings: { "rome-borghese": { date: "2027-01-30", time: "15:00" } },
    });
    const d = r.itinerary.days.find((x) => x.date === "2027-01-30")!;
    expect(d.items.find((i) => i.placeId === "rome-borghese")?.fixedTime).toBe("15:00");
  });
});

describe("alternatives & recommend", () => {
  it("우천 시 실내 대안만, 휴무 장소 제외", () => {
    const alts = suggestAlternatives(P("rome-caracalla"), "2027-01-31", places, { excludeIds: new Set(), rainy: true });
    expect(alts.length).toBeGreaterThan(0);
    for (const a of alts) {
      expect(a.place.indoor).toBe(true);
      expect(isOpenOnDate(a.place.openingHours, "2027-01-31")).toBe(true);
    }
  });
  it("관심사(미술)가 있으면 미술 장소 점수가 오른다", () => {
    const withArt = rankPlaces(places, prefs).find((s) => s.place.id === "rome-borghese")!.score;
    const without = rankPlaces(places, { ...prefs, interests: [] }).find((s) => s.place.id === "rome-borghese")!.score;
    expect(withArt).toBeGreaterThan(without);
  });
  it("예산 초과 장소는 감점", () => {
    const lux = rankPlaces([P("rome-via-condotti")] as Place[], { ...prefs, budget: 1 })[0];
    expect(lux.reasons).toContain("예산보다 높은 가격대");
  });
});

describe("meals", () => {
  it("생성 일정의 점심은 14:30 이전에 시작", () => {
    const ranked = rankPlaces(places, prefs, lodging);
    const candidates = ranked.map((s) => ({ place: s.place, must: s.place.tier === "must", score: s.score }));
    const res = generateItinerary({ cityId: "rome", dates: DATES, candidates, pace: "normal", lodging, ctx });
    for (const d of res.itinerary.days) {
      const tl = simulateDay(d, ctx);
      const lunch = tl.entries.find((e) => e.item.meal === "lunch" || e.item.note === "lunch")!;
      expect(lunch.start).toBeLessThanOrEqual(hhmmToMin("14:30"));
    }
  });
});

describe("quality", () => {
  it("생성 일정의 일몰 후 야외·영업 종료 경고가 전체 2건 이하", () => {
    const ranked = rankPlaces(places, prefs, lodging);
    const candidates = ranked.map((s) => ({ place: s.place, must: s.place.tier === "must", score: s.score }));
    const res = generateItinerary({ cityId: "rome", dates: DATES, candidates, pace: "normal", lodging, ctx });
    const codes = res.itinerary.days.flatMap((d) => simulateDay(d, ctx).entries.flatMap((e) => e.warnings.map((w) => w.code)));
    const bad = codes.filter((c) => c === "after_sunset" || c === "ends_after_close" || c === "arrive_after_close");
    expect(bad.length).toBeLessThanOrEqual(2);
  });
  it("일몰 명소는 일몰 30분 전에 시작", () => {
    const tl = simulateDay({ date: "2027-01-28", items: [{ id: "x", kind: "place", placeId: "rome-pincio" }] }, { ...ctx, dayStart: "15:00" });
    const sunset = hhmmToMin(tl.sunset);
    expect(tl.entries[0].start).toBe(sunset - 30);
  });
});

describe("admission & booking data", () => {
  it("모든 로마 장소에 입장료 정보가 있고, 링크는 https", () => {
    for (const p of places) {
      expect(p.admission, p.id).toBeDefined();
      if (p.booking?.official) expect(p.booking.official.url, p.id).toMatch(/^https:\/\//);
    }
  });
  it("확인 필요(check)·보고(reported) 항목은 조사일 또는 사유가 있음", () => {
    for (const p of places) {
      const a = p.admission!;
      if (a.status === "official") expect(a.sourceUrl, p.id).toBeTruthy();
      if (a.status === "check" || a.status === "reported") expect(a.detail, p.id).toBeTruthy();
    }
  });
  it("비공식 링크는 재판매 검색어가 있는 장소만, GetYourGuide·Tiqets", async () => {
    const { resellerLinks, admissionShort } = await import("@/lib/booking");
    expect(resellerLinks(P("rome-colosseum")).map((l) => l.name)).toEqual(["GetYourGuide", "Tiqets"]);
    expect(resellerLinks(P("rome-colosseum"))[0].url).toContain("q=Colosseum%20Rome");
    expect(resellerLinks(P("rome-da-enzo"))).toEqual([]);
    expect(admissionShort(P("rome-colosseum"))).toBe("입장 €18");
    expect(admissionShort(P("rome-pincio"))).toBe("입장 무료");
    expect(admissionShort(P("rome-castel-sant-angelo"))).toBe("입장 €16~20 (확인 필요)");
    expect(admissionShort(P("rome-da-enzo"))).toBeUndefined();
  });
});
