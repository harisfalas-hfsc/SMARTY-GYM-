/**
 * One builder for every public page's invisible head data: title, description,
 * keywords, robots directives, Open Graph, Twitter card, canonical, language
 * alternates and JSON-LD. Nothing here renders on screen.
 */
import { OG_IMAGE, ORG_ID, SITE_NAME, SITE_URL, WEBSITE_ID, absoluteUrl } from "@/lib/seo/site";
import { PAGE_SEO_BY_PATH, type PageSeo } from "@/lib/seo/page-seo";

export interface SeoHeadOptions {
  /** Route path ("/privacy"). Used for canonical, og:url and the registry lookup. */
  path: string;
  title?: string;
  description?: string;
  keywords?: string[];
  name?: string;
  ogType?: "website" | "article" | "profile";
  image?: string | null;
  schemaType?: string;
  /** Extra JSON-LD nodes merged into the page graph. */
  extraSchema?: Record<string, unknown>[];
  /** Breadcrumb trail after Home; defaults to the page's registry name. */
  breadcrumbs?: { name: string; path: string }[];
  noindex?: boolean;
}

export interface HeadPayload {
  meta: Record<string, string>[];
  links: Record<string, string>[];
  scripts: { type: string; children: string }[];
}

function breadcrumbNode(trail: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      ...trail.map((t, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: t.name,
        item: absoluteUrl(t.path),
      })),
    ],
  };
}

export function seoHead(options: SeoHeadOptions): HeadPayload {
  const registry: PageSeo | undefined = PAGE_SEO_BY_PATH[options.path];
  const url = absoluteUrl(options.path);
  const title = options.title ?? registry?.title ?? SITE_NAME;
  const description = options.description ?? registry?.description ?? "";
  const keywords = options.keywords ?? [
    ...(registry?.keyphrase ? [registry.keyphrase] : []),
    ...(registry?.keywords ?? []),
  ];
  const name = options.name ?? registry?.name ?? title;
  const image = options.image === null ? null : (options.image ?? OG_IMAGE);
  const ogType = options.ogType ?? "website";
  const schemaType = options.schemaType ?? registry?.schemaType ?? "WebPage";

  const meta: Record<string, string>[] = [
    { title },
    ...(description ? [{ name: "description", content: description }] : []),
    ...(keywords.length ? [{ name: "keywords", content: keywords.join(", ") }] : []),
    {
      name: "robots",
      content: options.noindex
        ? "noindex, follow"
        : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:locale", content: "en_US" },
    { property: "og:type", content: ogType },
    { property: "og:title", content: title },
    ...(description ? [{ property: "og:description", content: description }] : []),
    { property: "og:url", content: url },
    { name: "twitter:card", content: image ? "summary_large_image" : "summary" },
    { name: "twitter:title", content: title },
    ...(description ? [{ name: "twitter:description", content: description }] : []),
    ...(image
      ? [
          { property: "og:image", content: image },
          { name: "twitter:image", content: image },
        ]
      : []),
  ];

  const links: Record<string, string>[] = [
    { rel: "canonical", href: url },
    { rel: "alternate", hrefLang: "en", href: url },
    { rel: "alternate", hrefLang: "x-default", href: url },
  ];

  const graph: Record<string, unknown>[] = [
    {
      "@type": schemaType,
      "@id": `${url}#webpage`,
      url,
      name: title,
      description,
      inLanguage: "en",
      isPartOf: { "@id": WEBSITE_ID },
      publisher: { "@id": ORG_ID },
      ...(image ? { primaryImageOfPage: image } : {}),
    },
    breadcrumbNode(options.breadcrumbs ?? [{ name, path: options.path }]),
    ...(options.extraSchema ?? []),
  ];

  return {
    meta,
    links,
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }),
      },
    ],
  };
}
