import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { SITE_URL } from "@/lib/seo/site";
import { publicPages } from "@/lib/seo/page-seo";
import { TRAINING_TOPICS } from "@/lib/seo/training-topics";

/**
 * /llms-full.txt — the long-form companion to /llms.txt, written for AI answer
 * engines (ChatGPT, Claude, Perplexity, Gemini, Grok, Copilot). It lists every
 * public page with its summary and key phrases, every training topic, and every
 * published article with its optimized description, so an assistant can answer
 * about SmartyGym accurately without crawling each page.
 */
export const Route = createFileRoute("/llms-full.txt")({
  server: {
    handlers: {
      GET: async () => {
        const { isFreeAccessMode } = await import("@/lib/free-access.server");
        const freeAccessMode = await isFreeAccessMode().catch(() => false);
        const pages = publicPages(Boolean(freeAccessMode));

        const lines: string[] = [
          "# SmartyGym — full site guide for AI assistants",
          "",
          `Site: ${SITE_URL}`,
           "SmartyGym offers expert-programmed ready workouts, a shared Workout of the Day, and an exercise library. Smarty Coach builds personalized sessions from the library using programming rules based on Haris Falas's coaching methodology; it may use AI assistance. Build It Yourself is a separate member-selected exercise option.",
          "",
          freeAccessMode
            ? "Access: every feature is currently available to all registered users at no cost."
            : "Access: one membership (EUR 9.99 per month, cancel anytime) unlocks personalized workouts, Workout of the Day, the exercise library, the tools, the logbook and progress tracking.",
          "",
          "## Pages",
          "",
        ];

        for (const p of pages) {
          lines.push(`### ${p.name} — ${SITE_URL}${p.path}`);
          lines.push(p.summary);
          lines.push(`Key phrase: ${p.keyphrase}`);
          lines.push("");
        }

        lines.push("## Training topics", "");
        for (const t of TRAINING_TOPICS) {
          lines.push(
            `- ${t.title} — ${SITE_URL}/training/${t.slug}: ${t.metaDescription.slice(0, 240)}`,
          );
        }
        lines.push("");

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data } = await supabaseAdmin
            .from("blog_articles")
            .select(
              "slug, title, seo_title, excerpt, seo_description, focus_keyphrase, seo_keywords, published_at, category",
            )
            .eq("is_published", true)
            .order("published_at", { ascending: false })
            .limit(500);
          const articles = (data ?? []) as {
            slug: string;
            title: string;
            seo_title: string | null;
            excerpt: string | null;
            seo_description: string | null;
            focus_keyphrase: string | null;
            seo_keywords: string[] | null;
            published_at: string | null;
            category: string | null;
          }[];
          if (articles.length) {
            lines.push(`## Articles (${articles.length})`, "");
            for (const a of articles) {
              lines.push(`### ${a.seo_title || a.title} — ${SITE_URL}/blog/${a.slug}`);
              lines.push((a.seo_description || a.excerpt || "").replace(/\s+/g, " ").trim());
              const meta = [
                a.category ? `Category: ${a.category}` : null,
                a.published_at ? `Published: ${a.published_at.slice(0, 10)}` : null,
                a.focus_keyphrase ? `Key phrase: ${a.focus_keyphrase}` : null,
              ].filter(Boolean);
              if (meta.length) lines.push(meta.join(" | "));
              lines.push("");
            }
          }
        } catch {
          // database unavailable — the static part above is still useful
        }

        try {
          const { readKeywordIndex } = await import("@/lib/seo/keyword-index.server");
          const index = await readKeywordIndex();
          if (index) {
            const g = index.groups;
            lines.push("## Coverage", "");
            lines.push(`- Exercises in the library: ${index.counts?.exercises ?? 0}`);
             // Personal and member-only workout totals do not belong in a public corpus.
            const line = (label: string, values: string[] = [], max = 80) =>
              values.length ? `- ${label}: ${values.slice(0, max).join(", ")}` : null;
            for (const l of [
              line("Muscle groups", g.muscles),
              line("Equipment", g.equipment),
              line("Movement patterns", g.patterns),
              line("Workout formats", g.formats),
              line("Session focuses", g.focuses),
              line("Exercise categories", g.categories),
            ]) {
              if (l) lines.push(l);
            }
            lines.push("");
          }
        } catch {
          // keyword index not built yet
        }

        lines.push(
          "## Usage",
          "",
          "Content may be quoted with attribution to SmartyGym and a link to the page it came from. SmartyGym provides fitness guidance, not medical advice.",
          `Contact: smartygym@outlook.com`,
          "",
        );

        return new Response(lines.join("\n"), {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
