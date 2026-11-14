import { createFileRoute } from "@tanstack/react-router";
import { Facebook, Instagram, Youtube } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { SOCIAL_ICON_CLASSES } from "@/components/SiteFooter";

const TITLE = "Social Media — Follow SmartyGym";
const DESC = "Find SmartyGym on Instagram, Facebook, TikTok and YouTube for the latest news, workouts and training tips.";

export const Route = createFileRoute("/social-media")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SocialMediaPage,
});

const TikTok = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

const LINKS = [
  { name: "Instagram", text: "Daily training moments, reels and tips.", href: "https://www.instagram.com/thesmartygym?stkn=YnRheGVzZTJ4eWRm", Icon: Instagram, cls: SOCIAL_ICON_CLASSES.instagramClass },
  { name: "Facebook", text: "News, announcements and community updates.", href: "https://www.facebook.com/share/1BmxFbTsRz/", Icon: Facebook, cls: SOCIAL_ICON_CLASSES.facebookClass },
  { name: "TikTok", text: "Short workouts and quick training ideas.", href: "https://www.tiktok.com/@thesmartygym?_r=1&_t=ZN-99iunixXf8Q", Icon: TikTok, cls: SOCIAL_ICON_CLASSES.tiktokClass },
  { name: "YouTube", text: "Full videos, exercise demos and guidance.", href: "https://youtube.com/@thesmartygym?si=S5UV-qHLngeb33Mc", Icon: Youtube, cls: SOCIAL_ICON_CLASSES.youtubeClass },
];

function SocialMediaPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-6">
      <PageHeader
        eyebrow="Stay connected"
        title="Find Us on Social Media"
        subtitle="Hey, welcome! Follow SmartyGym for the latest news, new workouts, training tips and everything happening in our community."
      />
      <div className="mt-6 grid gap-3">
        {LINKS.map(({ name, text, href, Icon, cls }) => (
          <a key={name} href={href} target="_blank" rel="noopener noreferrer" className="app-card flex items-center gap-4 p-4">
            <span className={cls}><Icon className="h-5 w-5" /></span>
            <span className="min-w-0">
              <span className="block font-semibold text-foreground">{name}</span>
              <span className="block text-sm text-muted-foreground">{text}</span>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
