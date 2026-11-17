import { notFound } from "next/navigation";
import { CITY_ORDER, getCity, isCityId } from "@/data/cities";

/** 라우트 파라미터 → City. 잘못된 도시면 404 */
export function resolveCity(param: string) {
  if (!isCityId(param)) notFound();
  return getCity(param);
}

export const cityStaticParams = () => CITY_ORDER.map((city) => ({ city }));
