import type { City, CityId } from "@/types";
import { romeHeroPhoto } from "./rome/places";

export const CITIES: Record<CityId, City> = {
  rome: {
    id: "rome",
    name: { ko: "로마", en: "Rome", local: "Roma" },
    country: "IT",
    timezone: "Europe/Rome",
    center: { lat: 41.8986, lng: 12.4769 },
    zoom: 14,
    accent: "#B5533C",
    tagline: "영원의 도시에서 보내는 겨울",
    status: "active",
    heroPhoto: romeHeroPhoto,
    winterNote: "1~2월 낮 최고 12~14℃, 일몰 약 17:10~17:45. 우천일 대비 실내 일정을 섞으세요.",
  },
  florence: {
    id: "florence",
    name: { ko: "피렌체", en: "Florence", local: "Firenze" },
    country: "IT",
    timezone: "Europe/Rome",
    center: { lat: 43.7696, lng: 11.2558 },
    zoom: 15,
    accent: "#C08A2E",
    tagline: "르네상스의 요람",
    status: "coming-soon",
    winterNote: "",
  },
  venice: {
    id: "venice",
    name: { ko: "베네치아", en: "Venice", local: "Venezia" },
    country: "IT",
    timezone: "Europe/Rome",
    center: { lat: 45.4371, lng: 12.3326 },
    zoom: 15,
    accent: "#1F4E79",
    tagline: "카니발 시즌의 물의 도시",
    status: "coming-soon",
    winterNote: "",
  },
  milan: {
    id: "milan",
    name: { ko: "밀라노", en: "Milan", local: "Milano" },
    country: "IT",
    timezone: "Europe/Rome",
    center: { lat: 45.4642, lng: 9.19 },
    zoom: 14,
    accent: "#4A4A4A",
    tagline: "디자인과 쇼핑의 수도",
    status: "coming-soon",
    winterNote: "",
  },
  barcelona: {
    id: "barcelona",
    name: { ko: "바르셀로나", en: "Barcelona", local: "Barcelona" },
    country: "ES",
    timezone: "Europe/Madrid",
    center: { lat: 41.3874, lng: 2.1686 },
    zoom: 14,
    accent: "#1E5AA8",
    tagline: "가우디와 지중해의 도시",
    status: "coming-soon",
    winterNote: "",
  },
};

export const CITY_ORDER: CityId[] = ["rome", "florence", "venice", "milan", "barcelona"];
export const DEFAULT_CITY: CityId = "rome";
