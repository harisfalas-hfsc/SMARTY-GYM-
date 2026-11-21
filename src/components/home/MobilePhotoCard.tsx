import { Play } from "lucide-react";
import { WodRotatingImage } from "@/components/wod/WodRotatingImage";

/** Shared mobile photo treatment; the owning page supplies its existing link. */
export function MobilePhotoCard({ image, title, eyebrow, description, uniform = false, smoothImage = false }: {
  image: string; title: string; eyebrow: string; description: string; uniform?: boolean; smoothImage?: boolean;
}) {
  return (
    <div className="mobile-photo-card">
      {smoothImage ? <WodRotatingImage src={image} alt={title} loading="lazy" /> : <img src={image} alt={title} width={800} height={400} loading="lazy" decoding="async" />}
      <div className="mobile-photo-shade" />
      {uniform && <span className="absolute left-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-extrabold shadow-md" style={{ background: "var(--brand-blue)", color: "var(--on-brand)" }} aria-label={eyebrow}>{eyebrow.split(" ")[0]}</span>}
      <div className="mobile-photo-copy" data-brand-skip>
        {!uniform && <p className="text-[10px] font-bold uppercase">{eyebrow}</p>}
        <h3 className={`mt-2 text-xl font-extrabold leading-tight ${uniform ? "truncate" : ""}`}>{title}</h3>
        <p className={`mt-3 text-xs leading-5 ${uniform ? "line-clamp-2 h-10" : ""}`}>{description}</p>
      </div>
      <span className="mobile-photo-action"><Play className="h-4 w-4 fill-current" /></span>
    </div>
  );
}