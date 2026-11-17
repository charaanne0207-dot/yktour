// 로마 입장료·예약처 (2026-11-17 조사). 성인 일반 기준.
// status: official = 공식 출처 확인 / reported = 복수 출처 일치(공식 미확인) / check = 출처 상이 → 공식 확인 필요
//         free = 무료 공공장소 / none = 입장료 없음(식당·카페·상점)
import type { Admission, Booking } from "@/types";

const C = "2026-11-17";
const FREE: Admission = { price: "무료", detail: "공공장소 — 입장권 없음", status: "free" };
const NONE: Admission = { price: "입장료 없음", status: "none" };

export const romeAdmission: Record<string, { admission: Admission; booking?: Booking }> = {
  "rome-colosseum": {
    admission: {
      price: "€18",
      detail: "24시간권(콜로세움+포로 로마노+팔라티노), 온라인 예약비 €2 포함. 지하·아레나 포함 Full Experience €24. 18세 미만 무료, EU 18–25세 할인",
      status: "reported",
      checkedAt: C,
      sourceUrl: "https://colosseo.it/en/visit/opening-times-and-tickets/",
    },
    booking: {
      official: { name: "ticketing.colosseo.it", url: "https://ticketing.colosseo.it/", note: "시간 지정 필수, 방문일 30일 전 판매 시작" },
      resellerQuery: "Colosseum Rome",
      warning: "공식 판매처는 ticketing.colosseo.it 뿐입니다. 'official'을 내세운 유사 사이트는 수수료가 붙은 재판매처입니다.",
    },
  },
  "rome-roman-forum": {
    admission: { price: "콜로세움 통합권", detail: "콜로세움 24시간권(€18)에 포함 — 별도 입장권 없음", status: "reported", checkedAt: C },
    booking: { official: { name: "ticketing.colosseo.it", url: "https://ticketing.colosseo.it/", note: "콜로세움 통합권으로 예약" }, resellerQuery: "Roman Forum Palatine Hill" },
  },
  "rome-pantheon": {
    admission: {
      price: "€7",
      detail: "2026.7.1 인상(기존 €5). EU 18–25세 €2, 매월 첫째 일요일 무료, 미사 참석자 무료",
      status: "official",
      checkedAt: C,
      sourceUrl: "https://direzionemuseiroma.cultura.gov.it/en/pantheon",
    },
    booking: {
      official: { name: "Direzione Musei Roma (공식 안내)", url: "https://direzionemuseiroma.cultura.gov.it/en/pantheon", note: "현장 매표소는 폐장 1시간 전 마감" },
      resellerQuery: "Pantheon Rome",
    },
  },
  "rome-vatican-museums": {
    admission: {
      price: "€25",
      detail: "온라인 €20 + 예약비 €5 (현장 €20, 2026.5 인상). 6–18세·학생 할인. 마지막 일요일(1/31) 무료 — 예약 불가",
      status: "reported",
      checkedAt: C,
      sourceUrl: "https://www.museivaticani.va/",
    },
    booking: {
      official: { name: "tickets.museivaticani.va", url: "https://tickets.museivaticani.va/", note: "시스티나 성당 포함. 매진이 잦아 일찍 예약" },
      resellerQuery: "Vatican Museums Sistine Chapel",
      warning: "공식 온라인 판매처는 tickets.museivaticani.va 뿐입니다. 재판매처는 €33~ 수준으로 비쌉니다.",
    },
  },
  "rome-st-peters": {
    admission: {
      price: "대성당 무료",
      detail: "쿠폴라(돔) 계단 약 €10 / 엘리베이터+계단 약 €15 (현장 기준, 출처별 상이)",
      status: "check",
      checkedAt: C,
    },
    booking: {
      official: { name: "Basilica di San Pietro", url: "https://www.basilicasanpietro.va/", note: "대성당은 예약 없이 보안검색 후 입장" },
      resellerQuery: "St Peter's Basilica dome",
    },
  },
  "rome-trevi": {
    admission: {
      price: "€2",
      detail: "분수 앞 수조 구역만 유료(2026.2~). 광장에서 보기 무료, 22시 이후 무료. 5세 미만·로마 거주자 면제",
      status: "reported",
      checkedAt: C,
      sourceUrl: "https://www.npr.org/2026/02/03/g-s1-108471/trevi-fountain-fee-takes-effect",
    },
  },
  "rome-borghese": {
    admission: {
      price: "€18",
      detail: "€16 + 예약비 €2. 2시간 단위 시간 지정, 현장 구매 사실상 불가. 마지막 회차 할인 보고 있음",
      status: "check",
      checkedAt: C,
    },
    booking: {
      official: { name: "Galleria Borghese (공식)", url: "https://galleriaborghese.beniculturali.it/", note: "예약 필수 — 약 30일 전 오픈, 빨리 매진" },
      resellerQuery: "Galleria Borghese",
    },
  },
  "rome-castel-sant-angelo": {
    admission: { price: "€16~20", detail: "출처별 상이 — 공식 판매처에서 확인. 18세 미만 무료, EU 18–25세 €2", status: "check", checkedAt: C },
    booking: {
      official: { name: "CoopCulture (공식 위탁)", url: "https://www.coopculture.it/en/poi/castel-santangelo/" },
      resellerQuery: "Castel Sant'Angelo",
    },
  },
  "rome-capitoline-museums": {
    admission: {
      price: "€15",
      detail: "비거주자 일반. 특별전 기간 €20.50(공식, 2026.5–7 사례). 로마 거주자 무료(2026.2~)",
      status: "reported",
      checkedAt: C,
      sourceUrl: "https://www.museiincomuneroma.it/en/node/2017",
    },
    booking: {
      official: { name: "Musei in Comune Roma", url: "https://www.museiincomuneroma.it/en/node/2017" },
      resellerQuery: "Capitoline Museums",
    },
  },
  "rome-caracalla": {
    admission: {
      price: "€8",
      detail: "18세 미만 무료, EU 18–25세 €2. 특별전 기간(~2027.1.10)에는 €10 — 여행일(1/27~)에는 €8 예상",
      status: "reported",
      checkedAt: C,
    },
    booking: { official: { name: "Soprintendenza Speciale di Roma", url: "https://soprintendenzaspecialeroma.it/" }, resellerQuery: "Baths of Caracalla" },
  },
  "rome-san-clemente": {
    admission: { price: "지하 유적 유료", detail: "성당 본당 무료, 지하 유적 입장료는 공식 사이트에서 확인", status: "check" },
    booking: { official: { name: "Basilica di San Clemente", url: "https://www.basilicasanclemente.com/" }, resellerQuery: "Basilica San Clemente" },
  },
  "rome-spanish-steps": { admission: FREE },
  "rome-pincio": { admission: FREE },
  "rome-aventine-keyhole": { admission: FREE },
  "rome-coppede": { admission: FREE },
  "rome-trastevere": { admission: FREE },
  "rome-piazza-navona": { admission: FREE },
  "rome-gianicolo": { admission: FREE },
  "rome-campo-de-fiori": { admission: { ...FREE, detail: "광장 시장 — 입장권 없음" } },
  "rome-via-condotti": { admission: { ...NONE, detail: "쇼핑 거리" } },
  "rome-monti-shops": { admission: { ...NONE, detail: "쇼핑 거리" } },
  "rome-testaccio-market": { admission: { ...NONE, detail: "시장 — 입장권 없음" } },
  "rome-da-enzo": { admission: { ...NONE, detail: "식사 비용만" } },
  "rome-roscioli": {
    admission: { ...NONE, detail: "식사 비용만" },
    booking: { official: { name: "Roscioli 공식 예약", url: "https://www.salumeriaroscioli.com/", note: "온라인 예약 권장" } },
  },
  "rome-pizzarium": { admission: { ...NONE, detail: "식사 비용만" } },
  "rome-trapizzino": { admission: { ...NONE, detail: "식사 비용만" } },
  "rome-giolitti": { admission: { ...NONE, detail: "음료·디저트 비용만" } },
  "rome-sant-eustachio": { admission: { ...NONE, detail: "음료 비용만" } },
  "rome-antico-forno-roscioli": { admission: { ...NONE, detail: "구매 비용만" } },
};
