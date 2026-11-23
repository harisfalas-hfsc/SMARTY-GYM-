import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await (supabaseAdmin as any)
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden: admin access required");
  return supabaseAdmin as any;
}

export type AdminBlogArticle = {
  id: string; slug: string; title: string; excerpt: string | null; content: string; category: string;
  image_url: string | null; image_alt: string | null; read_time: string | null; is_published: boolean;
  published_at: string | null; created_at: string; updated_at: string; author_name: string; author_id: string | null;
};

const COLS = "id,slug,title,excerpt,content,category,image_url,image_alt,read_time,is_published,published_at,created_at,updated_at,author_name,author_id";

export const adminListBlogArticles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await assertAdmin(context.userId);
    const { data, error } = await db.from("blog_articles").select(COLS).order("created_at", { ascending: false }).limit(1000);
    if (error) throw new Error(error.message);
    return { articles: (data ?? []) as AdminBlogArticle[] };
  });

const SaveInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(3).max(200),
  excerpt: z.string().trim().max(400),
  content: z.string().min(20).max(200000),
  category: z.string().trim().min(1).max(60),
  image_url: z.string().url().max(1000).nullable(),
  image_alt: z.string().max(300).nullable(),
  is_published: z.boolean(),
});

export const adminSaveBlogArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => SaveInput.parse(d))
  .handler(async ({ data, context }) => {
    const db = await assertAdmin(context.userId);
    const { validateAndFixLinks, estimateReadTime, generateSlug } = await import("@/lib/cron/blog-generator.server");
    const content = validateAndFixLinks(data.content);
    const now = new Date().toISOString();
    const base = {
      title: data.title, excerpt: data.excerpt || null, content, category: data.category,
      image_url: data.image_url, image_alt: data.image_alt || data.title,
      read_time: estimateReadTime(content), is_published: data.is_published, updated_at: now,
    };
    let slug: string;
    if (data.id) {
      const { data: prev } = await db.from("blog_articles").select("slug,published_at").eq("id", data.id).maybeSingle();
      if (!prev) throw new Error("Article not found");
      slug = prev.slug;
      const { error } = await db.from("blog_articles").update({ ...base, published_at: data.is_published ? prev.published_at ?? now : prev.published_at }).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const root = generateSlug(data.title) || `article-${Date.now()}`;
      slug = root;
      for (let n = 2; ; n++) {
        const { data: clash } = await db.from("blog_articles").select("id").eq("slug", slug).maybeSingle();
        if (!clash) break;
        slug = `${root}-${n}`;
      }
      const { error } = await db.from("blog_articles").insert({
        ...base, slug, author_name: "Haris Falas", author_credentials: "Sports Scientist, CSCS",
        author_id: context.userId, published_at: data.is_published ? now : null, created_at: now,
      });
      if (error) throw new Error(error.message);
    }
    if (data.is_published) {
      try {
        const { submitToIndexNow } = await import("@/lib/seo/indexnow.server");
        await submitToIndexNow([`/blog/${slug}`, "/blog"]);
      } catch { /* best effort */ }
    }
    return { ok: true, slug };
  });

export const adminSetBlogVisibility = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ ids: z.array(z.string().uuid()).min(1).max(1000), visible: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await assertAdmin(context.userId);
    const now = new Date().toISOString();
    if (data.visible) {
      await db.from("blog_articles").update({ published_at: now }).in("id", data.ids).is("published_at", null);
    }
    const { error } = await db.from("blog_articles").update({ is_published: data.visible, updated_at: now }).in("id", data.ids);
    if (error) throw new Error(error.message);
    return { ok: true, count: data.ids.length };
  });

export const adminDeleteBlogArticles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ ids: z.array(z.string().uuid()).min(1).max(1000) }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await assertAdmin(context.userId);
    const { error } = await db.from("blog_articles").delete().in("id", data.ids);
    if (error) throw new Error(error.message);
    return { ok: true, count: data.ids.length };
  });

export const adminDraftBlogArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ title: z.string().max(200).optional(), about: z.string().trim().min(3).max(4000), keywords: z.string().max(1000).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { draftBlogArticle } = await import("@/lib/blog-admin.server");
    return draftBlogArticle(data);
  });

export const adminGenerateBlogCover = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ title: z.string().min(3).max(200), excerpt: z.string().max(400) }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await assertAdmin(context.userId);
    const { createBlogCoverImage } = await import("@/lib/cron/blog-image.server");
    const { generateSlug } = await import("@/lib/cron/blog-generator.server");
    const url = await createBlogCoverImage(db, { title: data.title, excerpt: data.excerpt || data.title, slug: generateSlug(data.title) || "article" });
    return { url };
  });

export const adminUploadBlogCover = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ base64: z.string().min(100).max(11_000_000), contentType: z.enum(["image/png", "image/jpeg", "image/webp"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await assertAdmin(context.userId);
    const { BLOG_IMAGE_BUCKET, blogCoverUrl } = await import("@/lib/cron/blog-image.server");
    const binary = atob(data.base64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const ext = data.contentType.split("/")[1];
    const fileName = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await db.storage.from(BLOG_IMAGE_BUCKET).upload(fileName, bytes, { contentType: data.contentType });
    if (error) throw new Error(`Upload failed: ${error.message}`);
    return { url: blogCoverUrl(fileName) };
  });
