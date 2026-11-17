import { AppShell } from "@/components/layout/AppShell";
import { cityStaticParams, resolveCity } from "@/lib/city";
import { publicEnv, serverEnv } from "@/lib/config/env";

export const generateStaticParams = cityStaticParams;
export const dynamicParams = false;

export default async function CityLayout({ children, params }: { children: React.ReactNode; params: Promise<{ city: string }> }) {
  const city = resolveCity((await params).city);
  const demo = [
    !publicEnv.googleMapsKey && "Google Maps",
    !serverEnv().googlePlacesKey && "Places(평점·사진)",
  ].filter(Boolean) as string[];
  return (
    <AppShell city={city} demo={demo}>
      {children}
    </AppShell>
  );
}
