import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  PRIVATE_PREFIXES,
  ROUTE_CLASSIFICATION,
  STATIC_SITEMAP_ENTRIES,
} from "@/lib/seo/route-inventory";
import { PAGE_SEO } from "@/lib/seo/page-seo";
import { seoHead } from "@/lib/seo/head";

const ROUTES_DIR = join(process.cwd(), "src/routes");

function routeIds(): string[] {
  const ids: string[] = [];
  const walk = (dir: string) => {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.tsx?$/.test(f)) {
        const m = readFileSync(p, "utf8").match(/create(?:File|Root)Route\(\s*["']([^"']+)["']/);
        if (m) ids.push(m[1]);
      }
    }
  };
  walk(ROUTES_DIR);
  return ids;
}

describe("SEO validation", () => {
  it("every page route (not raw files/API) is classified", () => {
    const pageIds = routeIds().filter(
      (id) =>
        !id.startsWith("/api/") &&
        !id.startsWith("/lovable/") &&
        !/\.(xml|txt)$/.test(id),
    );
    const missing = pageIds.filter((id) => !(id in ROUTE_CLASSIFICATION));
    expect(missing).toEqual([]);
  });

  it("sitemap has unique, public, absolute-safe paths", () => {
    const paths = STATIC_SITEMAP_ENTRIES.map((e) => e.path);
    expect(new Set(paths).size).toBe(paths.length);
    for (const p of paths) {
      expect(p.startsWith("/")).toBe(true);
      expect(PRIVATE_PREFIXES.some((x) => p === x || p.startsWith(`${x}/`))).toBe(false);
    }
  });

  it("robots.txt blocks private areas, lists sitemaps, and does not block search crawlers from the site", () => {
    const robots = readFileSync(join(process.cwd(), "public/robots.txt"), "utf8");
    expect(robots).toContain("Sitemap: https://smartygym.com/sitemap.xml");
    for (const bot of ["Googlebot", "Bingbot", "OAI-SearchBot", "PerplexityBot", "Applebot"]) {
      const block = robots.split(/\n(?=User-agent:)/).find((b) => b.startsWith(`User-agent: ${bot}\n`));
      expect(block, bot).toBeTruthy();
      expect(block).not.toMatch(/^Disallow: \/\s*$/m);
      for (const p of PRIVATE_PREFIXES) expect(block, `${bot} ${p}`).toContain(`Disallow: ${p}`);
    }
  });

  it("page registry titles and descriptions are unique and present", () => {
    const titles = PAGE_SEO.map((p) => p.title);
    const descs = PAGE_SEO.map((p) => p.description);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descs).size).toBe(descs.length);
    for (const p of PAGE_SEO) {
      expect(p.title.length).toBeGreaterThan(10);
      expect(p.description.length).toBeGreaterThan(50);
    }
  });

  it("head builder emits one absolute canonical and valid JSON-LD", () => {
    for (const p of PAGE_SEO) {
      const h = seoHead({ path: p.path });
      const canon = h.links.filter((l) => l.rel === "canonical");
      expect(canon).toHaveLength(1);
      expect(canon[0].href).toBe(`https://smartygym.com${p.path}`);
      for (const s of h.scripts) expect(() => JSON.parse(s.children)).not.toThrow();
    }
  });
});
