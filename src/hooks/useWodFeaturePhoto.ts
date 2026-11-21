import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTodayWod } from "@/lib/wod.functions";
import { WOD_PHOTO_INTERVAL_MS, wodPhotoAt } from "@/lib/wod/photo-rotation";

/** Shared public daily pictures, never a new request per picture change. */
export function useWodFeaturePhoto(fallback: string) {
  const [elapsed, setElapsed] = useState(0);
  const daily = useQuery({
    queryKey: ["wod-feature-photos"],
    queryFn: () => getTodayWod(),
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
  const photos = daily.data && !("error" in daily.data)
    ? daily.data.today.cards.flatMap(({ workout }) => workout.image_url ? [workout.image_url] : [])
    : [];
  const photoKey = photos.join("\n");
  useEffect(() => {
    setElapsed(0);
    for (const src of photoKey.split("\n").filter(Boolean)) {
      const image = new Image();
      image.src = src;
    }
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      if (timer !== undefined) clearInterval(timer);
      if (!preference.matches && photoKey.includes("\n")) {
        timer = setInterval(() => {
          if (document.visibilityState !== "hidden") setElapsed(value => value + WOD_PHOTO_INTERVAL_MS);
        }, WOD_PHOTO_INTERVAL_MS);
      }
    };
    start();
    preference.addEventListener("change", start);
    return () => {
      if (timer !== undefined) clearInterval(timer);
      preference.removeEventListener("change", start);
    };
  }, [photoKey]);
  return wodPhotoAt(photos, elapsed, fallback);
}