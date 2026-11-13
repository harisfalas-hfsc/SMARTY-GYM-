import { Play } from "lucide-react";

/** Shared mobile photo treatment; the owning page supplies its existing link. */
export function MobilePhotoCard({ image, title, eyebrow, description }: {
  image: string; title: string; eyebrow: string; description: string;
}) {
  return (
    <div className="mobile-photo-card">
      <img src={image} alt={title} width={800} height={400} loading="lazy" decoding="async" />
      <div className="mobile-photo-shade" />
      <div className="mobile-photo-copy" data-brand-skip>
        <p className="text-[10px] font-bold uppercase">{eyebrow}</p>
        <h3 className="mt-2 text-xl font-extrabold leading-tight">{title}</h3>
        <p className="mt-3 text-xs leading-5">{description}</p>
      </div>
      <span className="mobile-photo-action"><Play className="h-4 w-4 fill-current" /></span>
    </div>
  );
}