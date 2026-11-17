// 로마 장소 사진 수집 (Wikimedia Commons, 저작자·라이선스 포함) → src/data/cities/rome/photos.json
// 실행: node scripts/fetch-photos.mjs   (Google Places 연동 전 대체 사진 소스)
import { writeFileSync } from "node:fs";

const UA = { "User-Agent": "CiaoAI-travel-planner/0.1 (personal trip planner)" };

// placeId → 영문 위키백과 문서명 (또는 [문서명, 사진 설명]). 대표 이미지가 해당 장소/소장품을 보여 주는 경우만 등록
const TITLES = {
  "_city": "Rome",
  "rome-colosseum": "Colosseum",
  "rome-roman-forum": "Roman Forum",
  "rome-pantheon": "Pantheon, Rome",
  "rome-vatican-museums": ["Sistine Chapel ceiling", "시스티나 성당 천장화"],
  "rome-st-peters": "St. Peter's Basilica",
  "rome-trevi": "Trevi Fountain",
  "rome-borghese": ["Apollo and Daphne (Bernini)", "소장작: 베르니니 〈아폴론과 다프네〉"],
  "rome-spanish-steps": "Spanish Steps",
  "rome-pincio": "Pincian Hill",
  "rome-aventine-keyhole": "Villa del Priorato di Malta",
  "rome-san-clemente": "Basilica of San Clemente",
  "rome-coppede": "Quartiere Coppedè",
  "rome-trastevere": "Trastevere",
  "rome-piazza-navona": "Piazza Navona",
  "rome-castel-sant-angelo": "Castel Sant'Angelo",
  "rome-capitoline-museums": "Capitoline Museums",
  "rome-caracalla": "Baths of Caracalla",
  "rome-gianicolo": "Janiculum",
  "rome-campo-de-fiori": "Campo de' Fiori",
  "rome-via-condotti": "Via dei Condotti",
  "rome-testaccio-market": "Mercato di Testaccio",
  "rome-giolitti": "Giolitti",
  "rome-sant-eustachio": "Sant'Eustachio Il Caffè",
};

const strip = (html = "") => html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

const API = "https://en.wikipedia.org/w/api.php";
async function api(params) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetch(`${API}?${new URLSearchParams({ format: "json", formatversion: "2", ...params })}`, { headers: UA });
    const text = await r.text();
    if (r.ok && text.startsWith("{")) return JSON.parse(text);
    console.log(`  retry ${attempt + 1} (HTTP ${r.status})`);
    await new Promise((res) => setTimeout(res, 5000 * (attempt + 1)));
  }
  throw new Error("API unavailable");
}

// 1) 문서 대표 이미지 파일명 (1회 일괄 요청)
const entry = (v) => (Array.isArray(v) ? { title: v[0], caption: v[1] } : { title: v });
const titles = Object.values(TITLES).map((v) => entry(v).title);
const pi = await api({ action: "query", prop: "pageimages", piprop: "name", redirects: "1", titles: titles.join("|") });
const norm = new Map();
for (const n of pi.query.normalized ?? []) norm.set(n.from, n.to);
for (const n of pi.query.redirects ?? []) norm.set(n.from, n.to);
const resolve = (t) => { let x = t; for (let i = 0; i < 3 && norm.has(x); i++) x = norm.get(x); return x; };
const fileOf = new Map(pi.query.pages.filter((p) => p.pageimage && !/\.svg$/i.test(p.pageimage)).map((p) => [p.title, p.pageimage]));

// 2) 이미지 URL·저작자·라이선스 (1회 일괄 요청)
const files = [...new Set(fileOf.values())];
const ii = await api({ action: "query", prop: "imageinfo", iiprop: "url|extmetadata|size", iiurlwidth: "1280", titles: files.map((f) => `File:${f}`).join("|") });
const infoOf = new Map();
for (const p of ii.query.pages) {
  const info = p.imageinfo?.[0];
  if (!info) continue;
  const m = info.extmetadata ?? {};
  infoOf.set(p.title.replace(/^File:/, "").replace(/ /g, "_"), {
    url: info.thumburl ?? info.url,
    width: info.thumbwidth ?? info.width,
    height: info.thumbheight ?? info.height,
    author: strip(m.Artist?.value) || "Unknown",
    license: strip(m.LicenseShortName?.value) || "See source",
    sourceUrl: info.descriptionurl,
  });
}

const out = {};
for (const [id, v] of Object.entries(TITLES)) {
  const { title, caption } = entry(v);
  const file = fileOf.get(resolve(title));
  const info = file && infoOf.get(file.replace(/ /g, "_"));
  if (info) out[id] = { ...info, file, ...(caption ? { caption } : {}) };
  console.log(info ? "✓" : "–", id, info ? `${info.license} · ${info.author.slice(0, 40)}` : "(no image)");
}
writeFileSync(new URL("../src/data/cities/rome/photos.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
console.log(`saved ${Object.keys(out).length} photos`);
