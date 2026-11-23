import { SUGGESTED_LINKS, VALID_PATHS } from "@/lib/cron/blog-generator.server";


export type BlogDraft = { title: string; excerpt: string; content: string };

/** Writes an unsaved article draft from the administrator's brief. Never publishes. */
export async function draftBlogArticle(brief: { title?: string; about: string; keywords?: string }): Promise<BlogDraft> {
  const prompt = `You are the editorial writing assistant for SmartyGym, a complete online gym created by Sports Scientist Haris Falas. Write an evidence-based fitness article in Haris's expert, practical voice.

EDITORIAL BRIEF — follow it exactly:
${brief.title ? `- Working title: ${brief.title}\n` : ""}- What the article is about: ${brief.about}
${brief.keywords ? `- Keywords to cover naturally: ${brief.keywords}\n` : ""}
REQUIREMENTS: title under 60 characters; excerpt under 160 characters; HTML body 800-1200 words using <h2> (4-6 sections), <p>, <ul>/<li>, <strong>; no <h1>. Where injury or rehabilitation is involved, tell readers to follow their doctor's or physiotherapist's clearance. Include at least 3 natural internal links from:
${SUGGESTED_LINKS.map((l) => `  ${l}`).join("\n")}
ONLY use these internal paths:
${VALID_PATHS.join(", ")}

Respond with raw JSON only: {"title":"...","excerpt":"...","content":"<p>...</p>"}`;
  const { generateResponse, PaymentRequiredError, RateLimitError } = await import("@lovable.dev/ai-gateway");
  let text = "";
  try {
    const res = await generateResponse({ model: "openai/gpt-6-astra", instructions: "Respond with valid JSON only.", input: prompt });
    text = (res.output ?? []).flatMap((o: any) => (o.type === "message" ? o.content ?? [] : [])).filter((c: any) => c.type === "output_text").map((c: any) => c.text).join("");
  } catch (e) {
    if (e instanceof PaymentRequiredError) throw new Error("AI credits are used up — add credits to keep writing with AI.");
    if (e instanceof RateLimitError) throw new Error("AI is busy right now — please try again in a minute.");
    console.error("blog draft failed", e);
    throw new Error("The AI could not write the draft — please try again.");
  }
  text = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  let c: Partial<BlogDraft>;
  try { c = JSON.parse(text) as Partial<BlogDraft>; } catch { throw new Error("The AI returned an unreadable draft — please try again."); }
  if (!c.title || !c.content) throw new Error("The AI returned an incomplete draft — please try again.");
  const { validateAndFixLinks } = await import("@/lib/cron/blog-generator.server");
  return { title: c.title.trim(), excerpt: (c.excerpt || c.title).trim(), content: validateAndFixLinks(c.content) };
}
