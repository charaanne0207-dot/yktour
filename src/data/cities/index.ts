// 도시 = 데이터 플러그인. 새 도시는 폴더를 추가하고 여기에 등록만 하면 된다.
import type { CityEvent, CityId, Place } from "@/types";
import { CITIES, CITY_ORDER } from "./meta";
import { romePlaces } from "./rome/places";
import { romeEvents } from "./rome/events";

const PLACES: Record<CityId, Place[]> = {
  rome: romePlaces,
  florence: [],
  venice: [],
  milan: [],
  barcelona: [],
};

const EVENTS: Record<CityId, CityEvent[]> = {
  rome: romeEvents,
  florence: [],
  venice: [],
  milan: [],
  barcelona: [],
};

import { romeLodgingPresets } from "./rome/lodging";

const LODGING_PRESETS: Record<CityId, typeof romeLodgingPresets> = {
  rome: romeLodgingPresets,
  florence: [],
  venice: [],
  milan: [],
  barcelona: [],
};
export const getLodgingPresets = (id: CityId) => LODGING_PRESETS[id];

export { CITIES, CITY_ORDER };
export { DEFAULT_CITY } from "./meta";

export function isCityId(v: string): v is CityId {
  return v in CITIES;
}
export const getCity = (id: CityId) => CITIES[id];
export const getCityPlaces = (id: CityId) => PLACES[id];
export const getCityEvents = (id: CityId) => EVENTS[id];
export const getAllPlaces = () => CITY_ORDER.flatMap((c) => PLACES[c]);
export const getPlaceById = (id: string) => getAllPlaces().find((p) => p.id === id);
