// 공통 데이터 모델 — PRD §5.1

export type CityId = "rome" | "florence" | "venice" | "milan" | "barcelona";
export type Tier = "must" | "recommended" | "hidden";
export type Category = "sight" | "food" | "cafe" | "shopping" | "hidden" | "viewpoint";
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = 일요일

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Source {
  name: string;
  url: string;
  checkedAt?: string; // ISO date
}

export interface Photo {
  url: string;
  attribution: string; // 저작자
  license?: string;
  sourceUrl?: string; // 원본·라이선스 페이지
  caption?: string; // 장소 자체가 아닌 소장품 등일 때 설명
  width?: number;
  height?: number;
}

export interface City {
  id: CityId;
  name: { ko: string; en: string; local: string };
  country: "IT" | "ES";
  timezone: string;
  center: LatLng;
  zoom: number;
  accent: string; // CSS color
  tagline: string;
  status: "active" | "coming-soon";
  winterNote: string;
  heroPhoto?: Photo;
}

/** 하루 영업 구간. "HH:mm" 형식, close 가 open 보다 작으면 자정 넘김 */
export interface TimeRange {
  open: string;
  close: string;
}

export interface OpeningHours {
  /** 요일별 영업 구간. 키가 없거나 빈 배열이면 휴무 */
  weekly: Partial<Record<Weekday, TimeRange[]>>;
  alwaysOpen?: boolean;
  /** 특정 날짜 예외 (휴무 = 빈 배열) */
  exceptions?: { date: string; ranges: TimeRange[]; note?: string }[];
  note?: string;
}

export interface Place {
  id: string;
  cityId: CityId;
  googlePlaceId?: string;
  name: { ko: string; en: string; local: string };
  category: Category;
  tier: Tier;
  tags: string[];
  location: LatLng & { address: string; area: string };
  rating?: { value: number; count: number; source: "google" };
  priceLevel?: 1 | 2 | 3 | 4;
  openingHours: OpeningHours;
  durationMin: number;
  reservation: {
    required: "yes" | "recommended" | "no";
    url?: string;
    note?: string;
  };
  reason: { text: string; aiGenerated: boolean; reviewed: boolean };
  tips: string[];
  photos: Photo[];
  indoor: boolean;
  bestTime?: "morning" | "afternoon" | "sunset" | "night";
  sources: Source[];
  verifiedAt: string | null; // null = 미검수
  admission?: Admission;
  booking?: Booking;
}

/** 입장료 — status 로 신뢰도 구분 (공식 확인 / 복수 출처 보고 / 출처 상이 / 무료 공공장소 / 입장료 없음) */
export interface Admission {
  price: string; // 대표 가격 (성인 일반)
  detail?: string; // 할인·포함 내역
  status: "official" | "reported" | "check" | "free" | "none";
  checkedAt?: string;
  sourceUrl?: string;
}

export interface BookingLink {
  name: string;
  url: string;
  note?: string;
}

export interface Booking {
  official?: BookingLink; // 공식 판매·예약처
  /** 비공식 재판매 사이트 검색어 (영문). 없으면 비공식 링크 미표시 */
  resellerQuery?: string;
  warning?: string; // 사칭 사이트 등 주의
}

export interface CityEvent {
  id: string;
  cityId: CityId;
  name: string;
  kind: "free-entry" | "exhibition" | "performance" | "sale" | "festival";
  start: string;
  end: string;
  description: string;
  venue?: string;
  placeId?: string; // 큐레이션 장소와 연결된 경우
  /** confirmed = 공식 출처에서 날짜 확인 / expected = 정기 패턴 기반 예상 / check = 공식 일정표에서 직접 확인 필요 */
  status: "confirmed" | "expected" | "check";
  sources: Source[];
}

export interface SavedPlace {
  placeId: string;
  cityId: CityId;
  savedAt: string;
  mustVisit: boolean;
  note?: string;
}

export interface ItineraryItem {
  id: string;
  kind: "place" | "meal";
  placeId?: string; // kind === "place" 일 때
  meal?: "lunch" | "dinner"; // kind === "meal" 일 때 (주변 식당 자유 선택 슬롯)
  fixedTime?: string; // 예약·고정 시각 "HH:mm"
  note?: string;
}

export interface ItineraryDay {
  date: string; // YYYY-MM-DD
  items: ItineraryItem[];
  rainy?: boolean; // 사용자가 '비 오는 날'로 지정
}

export interface Itinerary {
  cityId: CityId;
  days: ItineraryDay[];
  updatedAt: string;
}

export interface Lodging extends LatLng {
  name: string;
  presetId?: string; // 지역 프리셋에서 고른 경우
}

export interface TripLeg {
  cityId: CityId;
  startDate: string;
  endDate: string;
  lodging?: Lodging;
}

export type Interest = "history" | "art" | "architecture" | "food" | "cafe" | "shopping" | "photo" | "night" | "local";
export type Pace = "relaxed" | "normal" | "packed";

export interface Preferences {
  interests: Interest[];
  pace: Pace;
  budget: 1 | 2 | 3 | 4;
  dayStart: string; // "09:00"
  dayEnd: string; // "21:30"
}

export interface Trip {
  id: string;
  legs: TripLeg[];
  prefs: Preferences;
}
