import { redirect } from "next/navigation";
import { DEFAULT_CITY } from "@/data/cities";

export default function RootPage() {
  redirect(`/${DEFAULT_CITY}`);
}
