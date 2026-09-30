import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Youtube } from "lucide-react";

// Real platform brand colors; pale tinted background keeps each icon visible
// in both light and dark view without changing the icon color.
const socialClass =
  "p-2 rounded-full border-2 transition-colors hover:opacity-80";
const instagramClass = `${socialClass} border-[#E1306C] text-[#E1306C] bg-[#E1306C]/10`;
const facebookClass = `${socialClass} border-[#1877F2] text-[#1877F2] bg-[#1877F2]/10`;
const tiktokClass = `${socialClass} border-[#010101] dark:border-white text-[#010101] dark:text-white bg-[#010101]/10 dark:bg-white/10`;
const youtubeClass = `${socialClass} border-[#FF0000] text-[#FF0000] bg-[#FF0000]/10`;

export function SiteFooter() {
  return (
    <footer className="bg-background w-full pt-4 pb-4 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-4">
            <a href="https://www.instagram.com/thesmartygym?stkn=YnRheGVzZTJ4eWRm" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={instagramClass}>
              <Instagram className="h-5 w-5" />
            </a>
            <a href="https://www.facebook.com/share/1BmxFbTsRz/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className={facebookClass}>
              <Facebook className="h-5 w-5" />
            </a>
            <a href="https://www.tiktok.com/@thesmartygym?_r=1&_t=ZN-99iunixXf8Q" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className={tiktokClass}>
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
              </svg>
            </a>
            <a href="https://youtube.com/@thesmartygym?si=S5UV-qHLngeb33Mc" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className={socialClass}>
              <Youtube className="h-5 w-5" />
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs sm:text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>

            <span className="text-muted-foreground/40">·</span>
            <Link to="/terms" className="hover:text-primary transition-colors">
              <span className="md:hidden">T&amp;Cs</span>
              <span className="hidden md:inline">Terms</span>
            </Link>
            <span className="text-muted-foreground/40">·</span>
            <Link to="/disclaimer" className="hover:text-primary transition-colors">Disclaimer</Link>

            <span className="hidden md:inline text-muted-foreground/40">·</span>
            <Link to="/the-smarty-method" className="hidden md:inline hover:text-primary transition-colors">Discover the Smarty Method</Link>
            <span className="hidden md:inline text-muted-foreground/40">·</span>
            <Link to="/why-invest-in-smartygym" className="hidden md:inline hover:text-primary transition-colors">Why Invest in Smarty Gym</Link>



          </div>

          <div className="text-center text-sm text-muted-foreground">

            <p>
              © {new Date().getFullYear()}{" "}
              <span className="text-primary font-semibold">SmartyGym</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
