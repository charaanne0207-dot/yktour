# PRD — 겨울 이탈리아·스페인 여행 플래너 웹앱 (가칭: **Viaggio**)

| 항목 | 내용 |
|---|---|
| 문서 버전 | v1.0 (2026-11-17) |
| 대상 여행 | 2027년 1월 말 ~ 2월 초 / 로마 · 피렌체 · 베네치아 · 밀라노 · 바르셀로나 |
| 1차 범위 (MVP) | **로마 단일 도시** 완성 → 검증 → 4개 도시 확장 |
| 플랫폼 | 모바일 우선 반응형 웹 (PWA), Vercel 배포 |

---

## 1. 제품 개요

### 1.1 문제 정의
- 여행지는 확정됐지만 관광지·맛집·카페·쇼핑·숨은 명소·행사 정보가 블로그·지도앱·SNS에 흩어져 있다.
- 겨울(1~2월)은 **일몰이 빠르고(로마 약 17:10~17:40)**, 비수기 휴무·단축 운영·우천이 많아 일반 일정표가 그대로 통하지 않는다.
- 박물관 예약 시간, 식당 영업시간(점심 12:30~15:00 / 저녁 19:30~), 숙소 위치, 도보·대중교통 시간을 동시에 고려해 일정을 짜기 어렵다.

### 1.2 목표
1. 도시별 **검증된 큐레이션**을 등급(Must Visit / Recommended / Hidden Gem)과 함께 제공한다.
2. 취향·날짜·숙소·영업시간·예약·날씨·일몰을 반영해 **실행 가능한 일정**을 자동 생성한다.
3. 지도에서 동선을 보고 드래그로 수정하면 **즉시 재계산**된다.
4. 모든 정보에 **출처와 최종 검증일**을 표시해 신뢰할 수 있게 한다.

### 1.3 비목표 (Non-goals)
- 항공·숙소·티켓 **직접 결제/예약 대행** (외부 공식 링크로 연결만).
- 다중 사용자 협업, 소셜 피드 (향후 검토).
- 실시간 대중교통 지연 정보.

### 1.4 사용자 페르소나
- **주 사용자**: 본 여행을 실제로 떠나는 개인/동행(1~4인). 한국어 사용, 모바일로 현지에서 확인.
- 특성: 유명 명소는 놓치고 싶지 않지만 관광객용 식당은 피하고 싶음. 사진·카페·쇼핑에 관심. 겨울 짧은 낮 시간을 효율적으로 쓰고 싶음.

### 1.5 성공 지표
| 지표 | 목표 |
|---|---|
| 로마 큐레이션 장소 수 | 80곳 이상 (관광 30 / 맛집 20 / 카페 10 / 쇼핑 10 / 숨은 명소 10) |
| 데이터 검증률 | Places API 매칭 및 운영시간 확인 100% |
| 일정 생성 시간 | 3일 일정 기준 10초 이내 (LLM 포함), 재계산 1초 이내 (로컬 알고리즘) |
| 일정 유효성 | 생성 일정 내 **휴무/영업시간 충돌 0건**, 예약 시간 위반 0건 |
| 모바일 성능 | Lighthouse Mobile Performance ≥ 85, Accessibility ≥ 90 |

---

## 2. 기능 요구사항

> 우선순위: **P0** = MVP(로마) 필수 / **P1** = 확장 단계 필수 / **P2** = 개선

### F1. 도시별 큐레이션 (P0)
- 카테고리: `관광` `맛집` `카페` `쇼핑` `숨은 명소` `행사` `야경/일몰 스폿`
- 도시 홈: 히어로 이미지, 여행 기간 날씨 요약, 일몰 시각, 이번 기간 행사, 등급별 추천 캐러셀
- 큐레이션 원천: 사전 구축한 **시드 데이터(JSON)** + Google Places로 사실 정보 보강 + LLM으로 추천 이유 초안 작성 → **사람 검수 후 확정**

### F2. 장소 상세 (P0)
| 필드 | 출처 | 비고 |
|---|---|---|
| 사진 (최대 5장) | Google Places Photos | 저작자 표기(attribution) 필수 |
| 추천 이유 (2~3문장) | 큐레이션 + LLM 초안 | 검수 표시 |
| 위치·주소·지도 미니뷰 | Places | "구글맵에서 열기" 딥링크 |
| 평점·리뷰 수 | Places | 리뷰 수 50 미만은 "표본 적음" 표시 |
| 가격대 | Places `priceLevel` + 큐레이션 | € ~ €€€€ |
| 운영시간 | Places `regularOpeningHours` + 공식 사이트 | **여행 날짜 기준 영업 여부 배지** |
| 예약 필요 여부·방법 | 큐레이션 | 공식 예약 링크, 권장 예약 시점 |
| 방문 팁 | 큐레이션 | 소요시간, 혼잡 시간대, 복장 규정(예: 바티칸·성당 어깨/무릎), 소매치기 주의 등 |
| 출처·최종 검증일 | 메타 | F10 참조 |

### F3. 추천 등급 (P0)
- **Must Visit**: 해당 도시 대표 명소, 놓치면 후회할 곳 (도시당 8~12곳)
- **Recommended**: 취향이 맞으면 강력 추천
- **Hidden Gem**: 관광객 밀도 낮은 로컬 명소·식당 (리뷰 수 대비 평점 높음, 현지인 비중 높음)
- 등급은 큐레이터가 지정하며, 카드·지도 마커·목록에 색상/아이콘으로 일관 표시.

### F4. 취향 기반 검색·필터·맞춤 추천 (P0)
- **온보딩 취향 설정(30초 이내)**: 관심사(미술·역사·건축·미식·카페·쇼핑·사진·야경), 여행 페이스(여유/보통/빡빡), 예산, 식사 선호(현지식·파인다이닝·채식 등), 도보 허용 거리
- 필터: 카테고리, 등급, 가격대, **선택 날짜 영업 중**, 숙소에서 거리, 실내(우천 대비), 예약 필요 여부
- 검색: 한글/영문/이탈리아어 장소명, 키워드 ("까르보나라", "젤라또")
- 맞춤 추천 점수 = 등급 가중치 + 취향 태그 일치도 + 평점 보정 + 숙소 거리 패널티 (규칙 기반, 설명 가능)

### F5. 북마크·저장 목록·필수 방문지 (P0)
- 하트(북마크) / 핀(필수 방문지) 2단계 구분
- 사용자 정의 리스트 (예: "로마 젤라또 투어")
- 필수 방문지는 일정 생성 시 **반드시 포함**되는 하드 제약

### F6. 일정 자동 생성 (P0)
**입력**: 도시별 체류 날짜, 숙소 위치, 취향, 필수 방문지, 확정 예약(장소·시각), 하루 시작/종료 희망 시각, 식사 시간 선호

**제약 조건 (하드)**
- 영업일·영업시간 내 방문 (요일별, 공휴일 포함)
- 확정 예약 시각 고정
- 필수 방문지 포함
- 일자별 숙소 출발·복귀

**목표 (소프트)**
- 이동시간 최소화(지역 클러스터링), 점심·저녁을 동선 근처 식당으로 배치
- 야외 명소는 **일몰 전**, 야경 스폿은 일몰 직후
- 우천 예보일은 실내 위주로 재배치
- 페이스별 하루 방문 수 (여유 3~4 / 보통 5~6 / 빡빡 7~8)

**알고리즘 (하이브리드)**
1. 규칙 기반 엔진: 지역 클러스터링(k-means/구역 태그) → 일자 배정 → 시간창 제약 하 순서 최적화(Greedy + 2-opt) → Routes API로 이동시간 확정
2. LLM(Claude): 후보 선택 보조, 하루 테마 이름·설명, 대안 제안 문구 생성. **시간 계산·영업 여부 판정은 LLM에 맡기지 않는다.**
3. 결과 검증기(validator): 충돌 탐지 → 경고 배지 + 자동 수정 제안

**출력**: 일자별 타임라인(도착/체류/이동수단·시간), 하루 요약(총 도보 거리, 이동시간), 경고(휴무·예약 필요·혼잡)

### F7. 지도 시각화·수정·재계산 (P0)
- Google Maps에 일자별 색상 경로 + 번호 마커
- 타임라인 ↔ 지도 동기화 (항목 탭 시 지도 포커스)
- 수정: 드래그로 순서 변경, 다른 날로 이동, 삭제, 추천 장소 추가, 체류시간 조정
- 수정 후 **재계산 버튼 / 자동 재계산** → 이동시간·도착시각 갱신, 충돌 시 경고
- 이동수단 선택: 도보 / 대중교통 / 택시

### F8. 겨울 시즌 특화 (P0 로마, P1 전체)
- **날씨**: 여행 15일 이내는 예보(Open-Meteo 등), 그 이전은 평년값(기후 통계) 표시
- **일몰·일출**: 날짜·좌표 기반 계산(suncalc 라이브러리), 일정 타임라인에 표시
- **휴무 캘린더**: 정기 휴무(예: 다수 국립박물관 월요일 휴관), 공휴일, 겨울 단축 운영
- **현지 행사** (출처 검증 필수, 날짜는 공식 발표 후 확정):
  - 베네치아 카니발 (2027년 사순절 일정 기준 1월 말~2월 9일 전후 예상 — 공식 일정 확인 필요)
  - 로마 '도메니카 알 무제오'(매월 첫째 일요일 국립 박물관 무료 — 예: 2027-02-07, 확인 필요)
  - 바티칸 박물관 매월 마지막 일요일 무료 개방 여부(확인 필요)
  - 겨울 세일 시즌(이탈리아·스페인 1월 세일), 밀라노·바르셀로나 기간 중 전시·공연
- 행사가 일정 기간과 겹치면 홈·일정에 배지로 노출하고 일정에 추가 가능

### F9. 모바일 UI (P0)
- 하단 탭: **홈 / 탐색 / 지도 / 일정 / 저장**
- 한 손 조작, 바텀시트 기반 상세, 엄지 영역 주요 CTA
- 오프라인 열람: 저장한 일정·장소 정보 캐시 (PWA)

### F10. 출처·검증·저장·복원 (P0)
- 모든 장소/행사에 `sources[]`(이름, URL, 확인일)와 `verifiedAt` 표시. 90일 경과 시 "재확인 필요" 표시
- LLM 생성 문장은 "AI 작성·검수됨/미검수" 라벨
- 일정 저장: Local Storage 자동 저장, **JSON 내보내기/가져오기**, 버전 스냅샷(최근 10개) 복원
- (P1) Supabase 연동 시 기기 간 동기화, 공유 링크(읽기 전용)

---

## 3. UX/UI

### 3.1 디자인 콘셉트 — "Winter Grand Tour"
- 유럽 겨울 여행의 차분하고 고급스러운 감성: 테라코타·크림 대리석·베네치아 블루·올리브
- 사진 중심, 넉넉한 여백, 세리프 헤드라인 + 산세리프 본문

| 토큰 | 값(초안) | 용도 |
|---|---|---|
| `--primary` | Terracotta `#B5533C` | CTA, Must Visit |
| `--secondary` | Venetian Blue `#1F4E79` | 링크, 경로 |
| `--accent` | Olive `#6B7A3A` | Hidden Gem |
| `--gold` | `#C9A227` | Recommended |
| `--bg` | Marble Cream `#FAF7F2` | 배경 |
| `--fg` | Espresso `#2B2420` | 본문 |
| Heading | Playfair Display / Noto Serif KR | |
| Body | Pretendard / Inter | |

- 다크 모드 지원 (야간 사용 고려)
- 도시별 액센트 컬러로 도시 구분 (로마=테라코타, 피렌체=오커, 베네치아=블루, 밀라노=차콜, 바르셀로나=지중해 코발트)

### 3.2 주요 화면
1. **온보딩**: 여행 기간·도시별 날짜·숙소 입력 → 취향 칩 선택
2. **도시 홈**: 히어로, 날씨/일몰 스트립, 기간 행사, 등급별 캐러셀, "내 일정 만들기" CTA
3. **탐색**: 카테고리 탭 + 필터 칩 + 카드 리스트 (지도 토글)
4. **장소 상세 (바텀시트/풀스크린)**: 사진 갤러리, 등급 배지, 추천 이유, 정보 표, 팁, 출처, 북마크/필수/일정에 추가
5. **일정**: 일자 탭 → 타임라인(시각·이동 칩·경고), 상단 미니맵, 편집 모드
6. **지도**: 일자별 경로, 마커 탭 → 카드 미리보기
7. **저장**: 북마크·필수·사용자 리스트, 내보내기/가져오기

### 3.3 UX 원칙
- 3탭 이내로 어떤 장소의 운영시간·예약 정보 도달
- 경고는 색+아이콘+텍스트 (색만으로 전달 금지)
- 로딩은 스켈레톤, LLM 생성은 스트리밍/단계 표시
- 터치 타깃 44px 이상, 본문 16px 이상

---

## 4. 기술 구조

### 4.1 스택
- **Framework**: Next.js (App Router) + React + TypeScript (strict)
- **UI**: Tailwind CSS + shadcn/ui + lucide-react, 애니메이션 framer-motion(최소 사용)
- **지도/장소**: Google Maps JavaScript API (`@vis.gl/react-google-maps`), Places API (New), Routes API
- **LLM**: Claude API (Anthropic SDK) — 서버 라우트에서만 호출
- **상태/저장**: Zustand + persist(Local Storage) → (P1) Supabase(Postgres + Auth)
- **유틸**: zod(스키마 검증), date-fns + date-fns-tz(Europe/Rome, Europe/Madrid), suncalc
- **테스트**: Vitest(일정 엔진 단위 테스트), Playwright(핵심 플로우 E2E)
- **배포**: Vercel (Preview/Production), 환경변수로 키 관리

### 4.2 디렉터리 구조
```
/app
  /(tabs)/[city]/page.tsx          도시 홈
  /(tabs)/[city]/explore/page.tsx  탐색
  /(tabs)/[city]/place/[id]/page.tsx
  /(tabs)/itinerary/page.tsx
  /(tabs)/map/page.tsx
  /(tabs)/saved/page.tsx
  /onboarding/page.tsx
  /api/places/[id]/route.ts        Places 프록시 + 캐시
  /api/routes/route.ts             Routes 프록시
  /api/itinerary/generate/route.ts LLM 보조 생성
  /api/weather/route.ts
/components
  /ui            shadcn 컴포넌트
  /place         PlaceCard, PlaceSheet, TierBadge, OpenStatusBadge, SourceList
  /itinerary     Timeline, DayTabs, TravelChip, ConflictAlert
  /map           MapView, RoutePolyline, NumberedMarker
  /common        FilterChips, WeatherStrip, SunsetBadge, EmptyState
/lib
  /engine        cluster.ts, schedule.ts, optimize.ts, validate.ts  (순수 함수)
  /google        places.ts, routes.ts
  /llm           claude.ts, prompts.ts
  /time          openingHours.ts, sun.ts, holidays.ts
  /store         useTripStore.ts, usePrefsStore.ts
/data
  /cities/rome/{places,events,meta}.json
  /cities/florence/... (P1)
/types           place.ts, itinerary.ts, trip.ts
```

### 4.3 핵심 설계 원칙
- **도시 = 데이터 플러그인**: 도시 추가 시 `/data/cities/{city}` + 메타(타임존, 중심 좌표, 액센트 컬러)만 추가하면 화면·엔진이 그대로 동작
- 일정 엔진은 **순수 TypeScript 함수**로 UI·API와 분리 → 단위 테스트 가능
- API 키는 서버 라우트에서만 사용 (Maps JS용 브라우저 키는 HTTP referrer 제한)
- Places 응답은 서버 캐시(Next `revalidate` 7일) + 정적 시드로 비용 최소화, Field Mask로 필요한 필드만 요청

### 4.4 외부 API 사용 정책
| API | 용도 | 비용 통제 |
|---|---|---|
| Places API (New) | 사진·평점·운영시간·가격대 | 빌드/검수 시 일괄 조회 후 JSON 저장, 런타임은 캐시 |
| Routes API | 구간 이동시간 | 구간 결과 캐시(키: 출발-도착-수단-시간대), 일정당 최대 호출 수 제한 |
| Maps JS | 지도 렌더링 | 지도 탭/상세에서만 로드(lazy) |
| Claude API | 추천 이유 초안, 일정 테마·대안 | 프롬프트 캐싱, 짧은 구조화 출력(JSON), 사용자 액션당 1회 |
| Open-Meteo | 예보/기후 | 무료, 6시간 캐시 |

---

## 5. 데이터

### 5.1 핵심 스키마 (TypeScript 요약)
```ts
type Tier = 'must' | 'recommended' | 'hidden';
type Category = 'sight' | 'food' | 'cafe' | 'shopping' | 'hidden' | 'event' | 'viewpoint';

interface Place {
  id: string;                 // slug, 예: "rome-pantheon"
  city: CityId;
  googlePlaceId: string;
  name: { ko: string; en: string; local: string };
  category: Category;
  tier: Tier;
  tags: string[];             // 'art','history','gelato','indoor','sunset' ...
  location: { lat: number; lng: number; address: string; area: string };
  rating?: { value: number; count: number; source: 'google' };
  priceLevel?: 1 | 2 | 3 | 4;
  openingHours: WeeklyHours;  // 요일별 구간, 예외일(exceptions[]) 포함
  durationMin: number;        // 권장 체류시간
  reservation: { required: 'yes' | 'recommended' | 'no'; url?: string; leadTimeDays?: number; note?: string };
  reason: { text: string; aiGenerated: boolean; reviewed: boolean };
  tips: string[];
  photos: { ref: string; attribution: string }[];
  indoor: boolean;
  bestTime?: 'morning' | 'afternoon' | 'sunset' | 'night';
  sources: { name: string; url: string; checkedAt: string }[];
  verifiedAt: string;         // ISO date
}

interface Event { id; city; name; dateRange: {start; end}; location?; description; url; sources; verifiedAt; }

interface Trip {
  id: string;
  legs: { city: CityId; startDate: string; endDate: string; lodging: { name; lat; lng } }[];
  prefs: Preferences;
  bookmarks: string[]; mustVisit: string[];
  bookings: { placeId: string; datetime: string }[];
  itinerary?: Itinerary;
  snapshots: { savedAt: string; itinerary: Itinerary }[];
}

interface ItineraryItem {
  placeId: string; start: string; end: string;
  travelFromPrev?: { mode: 'walk' | 'transit' | 'taxi'; minutes: number; meters: number };
  warnings: ('closed' | 'booking_needed' | 'after_sunset' | 'tight_transfer' | 'rain')[];
  locked: boolean;            // 예약 등 고정 항목
}
```

### 5.2 데이터 파이프라인
1. **시드 작성**: 장소 목록(이름·등급·카테고리·태그·팁)을 큐레이션 JSON으로 작성
2. **보강 스크립트** (`scripts/enrich.ts`): Places API Text Search → placeId 매칭 → 사진·평점·운영시간·가격 채움, 매칭 실패/중복은 리포트
3. **LLM 초안**: 추천 이유·팁 초안 생성 (`aiGenerated: true`, `reviewed: false`)
4. **검수**: 공식 사이트로 운영시간·예약·휴무 확인 → `reviewed: true`, `verifiedAt` 기록
5. **zod 검증**: 빌드 시 스키마 위반 시 실패

### 5.3 데이터 정확성 규칙
- 운영시간은 **공식 사이트 > Google Places** 우선, 불일치 시 `note`에 기재
- 행사 날짜는 공식 발표 전 "예상" 라벨, 확정 후 갱신
- LLM이 생성한 사실(가격·시간·주소)은 저장하지 않음 — 사실 필드는 API/공식 출처만 사용

---

## 6. 비기능 요구사항

| 영역 | 요구사항 |
|---|---|
| 성능 | LCP < 2.5s (4G), 이미지 next/image + lazy, 지도 지연 로드 |
| 오프라인 | PWA, 저장 일정·장소 상세 캐시 열람 가능 |
| 접근성 | WCAG 2.1 AA 대비, 키보드/스크린리더 라벨, 색 외 정보 전달 |
| 보안 | API 키 서버 보관, 브라우저 키 referrer 제한, LLM 입력 길이 제한, 레이트 리밋 |
| 비용 | Google API 월 무료 크레딧 내 운영 목표, LLM 호출 사용자 액션당 1회·캐시 |
| 국제화 | 한국어 UI 기본, 장소명 원어 병기, 시간은 현지 타임존 표기 |
| 신뢰성 | 외부 API 실패 시 캐시/시드 데이터로 폴백, 오류 메시지 명확히 |
| 법적 | Google Maps Platform 약관(사진 attribution, 데이터 캐싱 정책) 준수 |
| 유지보수 | ESLint + Prettier, 엔진 테스트 커버리지 ≥ 80% |

---

## 7. 개발 계획 (10~15분 단위 작업)

### Phase 0 — 셋업
1. Next.js + TS + Tailwind + shadcn 초기화, 디자인 토큰·폰트 적용
2. 타입·zod 스키마, Zustand 스토어(persist)
3. 하단 탭 레이아웃·라우팅 골격

### Phase 1 — 로마 데이터
4. 로마 시드 JSON 1차(Must Visit 10 + 맛집 10)
5. `enrich.ts` Places 보강 스크립트, 매칭 리포트
6. 나머지 장소 추가 및 검수 → 80곳 완료
7. 로마 행사·휴무·공휴일 데이터

### Phase 2 — 탐색 UI
8. PlaceCard / TierBadge / OpenStatusBadge
9. 도시 홈 (히어로·날씨·일몰·캐러셀)
10. 탐색 + 필터 + 검색
11. 장소 상세 시트 + 출처 표시
12. 북마크·필수·리스트

### Phase 3 — 일정 엔진
13. 영업시간 판정 `openingHours.ts` + 테스트
14. 클러스터링·일자 배정 + 테스트
15. 시간창 순서 최적화 + validator + 테스트
16. Routes API 연동·캐시
17. 온보딩(날짜·숙소·취향) → 생성 플로우

### Phase 4 — 지도·편집
18. 지도 경로·번호 마커
19. 타임라인 편집(드래그·이동·삭제) + 재계산
20. 날씨·일몰 반영 재배치, 경고 UI

### Phase 5 — 저장·마무리
21. 스냅샷·JSON 내보내기/가져오기
22. Claude 연동(테마·대안 제안)
23. PWA·성능·접근성 점검, Vercel 배포
24. **로마 검증 (완료 기준 6.1 체크)**

### Phase 6 — 확장 (P1)
25~. 피렌체 → 베네치아 → 밀라노 → 바르셀로나 데이터 추가(도시당 데이터 위주), 도시 간 이동일(기차·항공) 일정 처리, 다도시 Trip 뷰

### 작업 규칙
- 각 작업은 독립 커밋 가능한 단위로 완료
- 오류는 관련 파일만 수정, 같은 오류 2회 재시도 실패 시 원인 정리 후 접근 변경
- 반복 분석·전체 재작성 금지, 공통 컴포넌트 우선 재사용

---

## 8. 완료 기준 (Definition of Done)

### 8.1 로마 MVP
- [ ] 로마 장소 80곳 이상, 전 장소 placeId 매칭·운영시간·출처·검증일 보유
- [ ] 등급 3종이 카드·지도·상세에서 일관 표시
- [ ] 취향 설정 후 추천 순서가 변하고, 필터(영업 중·실내·가격·거리) 정상 동작
- [ ] 북마크/필수/리스트가 새로고침 후에도 유지
- [ ] 3박 4일 일정 자동 생성 시 휴무·영업시간·예약 충돌 0건, 필수 방문지 100% 포함
- [ ] 지도에 일자별 경로 표시, 순서 변경 후 재계산 1초 이내 반영
- [ ] 일몰 시각·날씨(예보 또는 평년값)·기간 행사 표시
- [ ] 일정 JSON 내보내기 → 가져오기로 동일 복원, 스냅샷 복원 동작
- [ ] 375px 모바일 화면에서 가로 스크롤 없음, Lighthouse Mobile Perf ≥ 85 / A11y ≥ 90
- [ ] 엔진 단위 테스트 통과, 핵심 E2E(온보딩→생성→편집→저장) 통과
- [ ] Vercel Production 배포 및 실기기(iOS Safari, Android Chrome) 확인

### 8.2 전체 확장
- [ ] 5개 도시 각 60곳 이상 검증 데이터
- [ ] 도시 간 이동일 포함 전체 여행 일정 생성
- [ ] 출발 2주 전 운영시간·행사 전수 재검증 완료

---

## 9. 리스크 및 대응

| 리스크 | 대응 |
|---|---|
| Places 운영시간 부정확·겨울 단축 운영 누락 | 공식 사이트 교차 검증, 예외일 필드, 현지에서 "정보 오류 신고" 메모 |
| API 비용 초과 | 정적 데이터화, 캐시, Field Mask, 예산 알림 |
| LLM 환각 | 사실 필드 LLM 금지, 검수 라벨, 구조화 출력 + zod 검증 |
| 행사 일정 미확정 | "예상" 라벨, 공식 발표 후 갱신 체크리스트 |
| 개발 범위 비대화 | 로마 DoD 통과 전 확장 금지, P2 기능 백로그 분리 |

## 10. 향후 백로그 (P2)
- 동행자 공유·공동 편집, 경비 기록, 현지 회화 카드, 일정 PDF 출력, 실시간 혼잡도, 다국어 UI
