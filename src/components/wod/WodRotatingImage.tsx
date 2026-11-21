import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Keeps the outgoing picture visible while the next one slides in left-to-right. */
export function WodRotatingImage({ src, fallback, alt, className, loading = "eager" }: { src: string; fallback?: string; alt: string; className?: string; loading?: "eager" | "lazy" }) {
  const [frame, setFrame] = useState({ current: src, previous: null as string | null, id: 0 });
  useEffect(() => {
    let active = true;
    const image = new Image();
    const show = () => {
      if (active) setFrame((value) => value.current === image.src || value.current === src ? value : { current: image.src, previous: value.current, id: value.id + 1 });
    };
    image.onload = () => { void image.decode().catch(() => undefined).then(show); };
    image.onerror = () => { if (fallback && image.src !== new URL(fallback, window.location.href).href) image.src = fallback; };
    image.src = src;
    if (image.complete && image.naturalWidth > 0) show();
    return () => { active = false; };
  }, [src, fallback]);
  const onError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    if (fallback && image.dataset.fallback !== "1") { image.dataset.fallback = "1"; image.src = fallback; }
  };
  return <span data-wod-photo className={cn("absolute inset-0 block overflow-hidden", className)}>
    {frame.previous ? <img src={frame.previous} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" /> : null}
    <img key={frame.id} src={frame.current} onError={onError} alt={alt} loading={loading} decoding="async" className={cn("absolute inset-0 h-full w-full object-cover", frame.previous && "wod-photo-slide")} />
  </span>;
}