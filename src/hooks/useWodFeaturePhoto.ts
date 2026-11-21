import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTodayWod } from "@/lib/wod.functions";
import { WOD_PHOTO_INTERVAL_MS, wodFeaturePhotoAt } from "@/lib/wod/photo-rotation";

/** Mobile-only discrete photo swaps, never a new request per picture change. */
export function useWodFeaturePhoto(fallback: string, suppliedPhotos?: readonly string[], offset = 0) {
  const [mobile, setMobile] = useState<boolean | null>(null);
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const viewport = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(viewport.matches);
    update();
    viewport.addEventListener("change", update);
    return () => viewport.removeEventListener("change", update);
  }, []);
  const daily = useQuery({
    queryKey: ["wod-feature-photos"],
    queryFn: () => getTodayWod(),
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    enabled: mobile === true && suppliedPhotos === undefined,
  });
  const photos = suppliedPhotos ?? (daily.data && !("error" in daily.data)
    ? daily.data.today.cards.flatMap(({ workout }) => workout.image_url ? [workout.image_url] : [])
    : []);
  const photoKey = photos.join("\n");
  useEffect(() => {
    setElapsed(0);
    for (const src of photoKey.split("\n").filter(Boolean)) {
      const image = new Image();
      image.src = src;
    }
    let timer: ReturnType<typeof setInterval> | undefined;
    // Discrete image replacement has no sliding/fading motion to suppress.
    if (mobile && photoKey.includes("\n")) {
      timer = setInterval(() => {
        if (document.visibilityState !== "hidden") setElapsed(value => value + WOD_PHOTO_INTERVAL_MS);
      }, WOD_PHOTO_INTERVAL_MS);
    }
    return () => {
      if (timer !== undefined) clearInterval(timer);
    };
  }, [photoKey, mobile]);
  return wodFeaturePhotoAt(mobile, photos, elapsed, fallback, offset);
}