import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  redirect,
} from "@tanstack/react-router";
import { resolveLegacyPath } from "../lib/seo/legacy-redirects";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Navigation } from "../components/Navigation";
import { SiteFooter } from "../components/SiteFooter";
import { Toaster } from "../components/ui/sonner";
import { BottomNav } from "../components/BottomNav";
import { ThemeProvider, THEME_INIT_SCRIPT } from "../lib/theme";
import { getFreeAccessMode } from "../lib/free-access.functions";
import { seedFreeAccessMode } from "../hooks/useFreeAccessMode";


const SITE_URL = "https://smartygym.com";
const OG_IMAGE = "https://smartygym.com/og-social.jpg";

const SITE_DESCRIPTION =
  "Personalized workouts built from your goals, experience, equipment and limitations, guided by Smarty Coach and sports scientist Haris Falas.";

const NATIVE_WRAPPER_INIT_SCRIPT = `(function(){try{var u=navigator.userAgent||'';var q=new URLSearchParams(location.search);var stored=false;try{stored=localStorage.getItem('smartygym-native-wrapper')==='1';}catch(e){}var c=!!window.Capacitor;var a=/;\\s?wv\\)/i.test(u)||/\\swv\\s/i.test(u)||/Version\\/\\d+(?:\\.\\d+)?[^;]*Chrome\\//i.test(u);var i=/(iPhone|iPad|iPod)/i.test(u)&&/AppleWebKit/i.test(u)&&!/Safari/i.test(u);var marked=q.has('nativeApp')||q.has('forceHideBadge')||stored;if(!(c||a||i||marked))return;var r=document.documentElement;r.classList.add('native-shell');r.style.setProperty('--app-safe-area-top','0px');r.style.backgroundColor='#000';try{localStorage.setItem('smartygym-native-wrapper','1');}catch(e){}var hide=function(){try{var p=window.Capacitor&&window.Capacitor.Plugins;if(!p)return;var legacy=p.StatusBar;if(legacy&&typeof legacy.setOverlaysWebView==='function'){Promise.resolve(legacy.setOverlaysWebView({overlay:true})).catch(function(){});}var bars=p.SystemBars||legacy;if(bars&&typeof bars.hide==='function'){Promise.resolve(bars.hide({bar:'StatusBar'})).catch(function(){});}}catch(e){}};hide();document.addEventListener('deviceready',hide,{once:true});window.addEventListener('load',hide,{once:true});setTimeout(hide,250);setTimeout(hide,1000);}catch(e){}})();`;


const KEYWORDS = [
  "personalized workout generator",
  "online personal trainer",
  "workout planner",
  "fitness coach app",
  "personalized workout plan",
  "custom workout generator",
  "workout plan generator",
  "workout of the day",
  "daily workout",
  "home workout plan",
  "gym workout plan",
  "bodyweight workout",
  "dumbbell workout",
  "kettlebell workout",
  "resistance band workout",
  "no equipment workout",
  "strength training plan",
  "hypertrophy program",
  "muscle building workout",
  "fat loss workout",
  "conditioning workout",
  "HIIT workout",
  "circuit training",
  "EMOM workout",
  "AMRAP workout",
  "mobility routine",
  "warm up routine",
  "exercise library",
  "exercise database",
  "exercise demonstrations",
  "workout timer",
  "rounds tracker",
  "1RM calculator",
  "one rep max calculator",
  "training logbook",
  "workout tracker",
  "progress tracking",
  "periodization",
  "progressive overload",
  "beginner workout plan",
  "advanced workout plan",
  "injury friendly workout",
  "sports science training",
  "Smarty Coach",
  "SmartyGym",
].join(", ");

const JSONLD_GRAPH = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "SmartyGym",
      alternateName: ["Smarty Gym", "SmartyGym"],
      url: SITE_URL,
      logo: `${SITE_URL}/icon-512.png`,
      image: OG_IMAGE,
      description:
        "SmartyGym creates personalized workouts through Smarty Coach, built on the coaching expertise of sports scientist Haris Falas.",
      foundingDate: "2024",
      email: "smartygym@outlook.com",
      knowsAbout: [
        "Strength training",
        "Hypertrophy training",
        "Conditioning",
        "Workout programming",
        "Periodization",
        "Progressive overload",
        "Exercise selection",
        "Mobility and warm-up",
        "Bodyweight training",
        "Kettlebell training",
        "Dumbbell training",
        "Injury-aware training",
        "Sports science",
        "personalized workout generation",
        "Personalized fitness coaching",
      ],
      founder: {
        "@type": "Person",
        "@id": `${SITE_URL}/haris-falas#person`,
        name: "Haris Falas",
        jobTitle: "Sports Scientist & Strength and Conditioning Coach",
        url: `${SITE_URL}/haris-falas`,
        worksFor: { "@id": `${SITE_URL}/#organization` },
        knowsAbout: [
          "Strength and conditioning",
          "Hypertrophy training",
          "Metabolic conditioning",
          "Mobility and stability training",
          "Bodyweight training",
          "Periodization",
          "Progressive overload",
          "Exercise selection and technique",
          "Warm-up and activation",
          "Injury-aware and rehabilitation-informed training",
          "Movement screening",
          "Football performance",
          "Athletic development",
          "Sports science",
        ],
        hasCredential: [
          {
            "@type": "EducationalOccupationalCredential",
            credentialCategory: "certification",
            name: "NSCA Certified Strength and Conditioning Specialist (CSCS)",
            recognizedBy: {
              "@type": "Organization",
              name: "National Strength and Conditioning Association",
            },
          },
          {
            "@type": "EducationalOccupationalCredential",
            credentialCategory: "certification",
            name: "EXOS Performance and Rehab Specialist",
            recognizedBy: { "@type": "Organization", name: "EXOS" },
          },
          {
            "@type": "EducationalOccupationalCredential",
            credentialCategory: "certification",
            name: "FMS Specialist",
            recognizedBy: {
              "@type": "Organization",
              name: "Functional Movement Systems",
            },
          },
          {
            "@type": "EducationalOccupationalCredential",
            credentialCategory: "certification",
            name: "ACE Medical Exercise Specialist",
            recognizedBy: {
              "@type": "Organization",
              name: "American Council on Exercise",
            },
          },
          {
            "@type": "EducationalOccupationalCredential",
            credentialCategory: "degree",
            name: "BSc Sport Science",
          },
        ],
        sameAs: [
          `${SITE_URL}/haris-falas`,
          "https://www.instagram.com/thesmartygym",
          "https://smartygym.com",
        ],
      },

      sameAs: [
        "https://smartygym.com",
        "https://www.instagram.com/thesmartygym",
      ],
      contactPoint: [
        {
          "@type": "ContactPoint",
          email: "smartygym@outlook.com",
          contactType: "customer support",
          availableLanguage: ["English"],
        },
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "SmartyGym",
      description: SITE_DESCRIPTION,
      inLanguage: "en",
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/exercise-library?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": ["SoftwareApplication", "WebApplication"],
      "@id": `${SITE_URL}/#software`,
      name: "SmartyGym — Personalized Workout Generator",
      applicationCategory: "HealthApplication",
      applicationSubCategory: "Personalized workout generator and personal training coach",
      operatingSystem: "Web, iOS, Android",
      browserRequirements: "Requires a modern web browser with JavaScript enabled",
      url: SITE_URL,
      image: OG_IMAGE,
      publisher: { "@id": `${SITE_URL}/#organization` },
      description: SITE_DESCRIPTION,
      featureList: [
        "Personalized workout generator built on your training profile",
        "Workout of the Day in bodyweight and equipment variants",
        "Exercise library with 1,300+ demonstrated movements",
        "Equipment-aware exercise filtering",
        "Injury and limitation aware programming",
        "Beginner, intermediate and advanced difficulty ladder",
        "Interactive workout player with rest timers",
        "Training logbook and calendar scheduling",
        "Progress tracking and workout feedback loop",
        "Workout timer, rounds tracker and 1RM calculator",
      ],
      keywords: KEYWORDS,
    },
  ],
};

/** Paid offer node — omitted entirely while Global Free Access Mode is ON. */
const PAID_OFFER = {
  "@type": "Offer",
  price: "9.99",
  priceCurrency: "EUR",
  category: "subscription",
  availability: "https://schema.org/InStock",
  url: `${SITE_URL}/pricing`,
};

const FREE_OFFER = {
  "@type": "Offer",
  price: "0",
  priceCurrency: "EUR",
  availability: "https://schema.org/InStock",
  url: SITE_URL,
};

function jsonLdGraph(freeAccessMode: boolean) {
  const graph = JSONLD_GRAPH["@graph"].map((node: Record<string, unknown>) =>
    node["@type"] === "WebApplication" || node["@type"] === "SoftwareApplication"
      ? { ...node, offers: freeAccessMode ? FREE_OFFER : PAID_OFFER }
      : node,
  );
  return { ...JSONLD_GRAPH, "@graph": graph };
}


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  // Invisible SEO preservation: addresses published by the previous
  // smartygym.com static site (the old ".html" pages) are answered with a
  // permanent redirect so their search ranking transfers to this app. Handled
  // at the root so legacy paths win over same-shaped app routes such as
  // /workout/<id>. Nothing else about the request changes.
  beforeLoad: ({ location }) => {
    if (!location.pathname.toLowerCase().includes(".html")) return;
    const target = resolveLegacyPath(location.pathname);
    if (target && target !== location.pathname) {
      throw redirect({ href: target, statusCode: 301 });
    }
  },
  loader: async () => {
    try {
      return await getFreeAccessMode();
    } catch {
      return { freeAccessMode: false };
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      {
        title:
          "SmartyGym — Personalized Workouts with Smarty Coach",
      },
      { name: "description", content: SITE_DESCRIPTION },
      { name: "keywords", content: KEYWORDS },
      { name: "author", content: "SmartyGym" },
      {
        name: "robots",
        content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
      },
      { name: "googlebot", content: "index, follow, max-image-preview:large, max-snippet:-1" },
      { name: "application-name", content: "SmartyGym" },
      { name: "apple-mobile-web-app-title", content: "SmartyGym" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "theme-color", content: "#000000" },
      { name: "color-scheme", content: "dark" },

      { property: "og:site_name", content: "SmartyGym" },
      { property: "og:locale", content: "en_US" },
      { property: "og:type", content: "website" },
      {
        property: "og:title",
        content:
          "SmartyGym — Personalized Workouts with Smarty Coach",
      },
      { property: "og:description", content: SITE_DESCRIPTION },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@smartygym" },
      {
        name: "twitter:title",
        content:
          "SmartyGym — Personalized Workouts with Smarty Coach",
      },
      { name: "twitter:description", content: SITE_DESCRIPTION },
      { property: "og:url", content: "https://smartygym.com/" },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:image", content: OG_IMAGE },

    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", type: "image/png", sizes: "64x64", href: "/favicon.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png" },
      { rel: "shortcut icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(jsonLdGraph(Boolean(loaderData?.freeAccessMode))),
      },
      {
        async: true,
        src: "https://www.googletagmanager.com/gtag/js?id=G-P5GKLY51WY",
      },
      {
        children:
          "window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-P5GKLY51WY');",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className="dark"
      style={{ colorScheme: "dark", backgroundColor: "#000000" }}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: NATIVE_WRAPPER_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <style>{`html,body{margin:0;min-height:100%;background:#000}`}</style>
        <HeadContent />
      </head>
      <body style={{ backgroundColor: "#000000" }}>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { freeAccessMode } = Route.useLoaderData();
  // Seed synchronously so every useFreeAccessMode() consumer renders the right
  // copy on the very first paint (SSR and hydration) — no paid-copy flash.
  seedFreeAccessMode(freeAccessMode);

  useEffect(() => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.dispatchEvent(new Event("smartygym:native-ready"));
      });
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <div className="flex min-h-screen flex-col bg-background">
          <Navigation />
          <main>
            <Outlet />
          </main>
          <SiteFooter />
          <Toaster />
          <BottomNav />
        </div>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

