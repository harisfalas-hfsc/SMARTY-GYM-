import { createClient } from "@supabase/supabase-js";
import { optimizeSharedWorkouts } from "@/lib/seo/workout-seo.server";
const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const r = await optimizeSharedWorkouts(db as never, { limit: 5 });
console.log(JSON.stringify(r, null, 2));
const { data } = await db.from("blog_articles").select("slug, seo_title, focus_keyphrase, image_alt, seo_faq").not("seo_optimized_at","is",null).limit(2);
console.log(JSON.stringify(data, null, 2).slice(0, 1200));
