// 날짜 문자열(YYYY-MM-DD)은 타임존 영향을 피하기 위해 UTC 정오 기준으로 계산한다.

const toDate = (iso: string) => new Date(`${iso}T12:00:00Z`);
const toIso = (d: Date) => d.toISOString().slice(0, 10);

export function weekdayOf(iso: string): number {
  return toDate(iso).getUTCDay();
}

export function dateRange(start: string, end: string, max = 21): string[] {
  const out: string[] = [];
  const d = toDate(start);
  const last = toDate(end);
  while (d <= last && out.length < max) {
    out.push(toIso(d));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"];
export const weekdayKo = (i: number) => WEEKDAY_KO[i];

export function formatDateKo(iso: string): string {
  const d = toDate(iso);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()} (${WEEKDAY_KO[d.getUTCDay()]})`;
}

export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart <= bEnd && bStart <= aEnd;
}
