import type { LatLng } from "@/types";

export interface MapMarker {
  id: string;
  position: LatLng;
  title: string;
  color: string;
  label?: string; // 방문 순서 번호
  href?: string;
}

export interface MapCanvasProps {
  center: LatLng;
  zoom: number;
  markers: MapMarker[];
  /** 방문 순서대로 연결한 직선 경로 (간이 동선) */
  path?: LatLng[];
  lodging?: LatLng & { name: string };
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}
