import { createClient } from "@supabase/supabase-js";
import { optimizeArticles } from "@/lib/seo/article-optimizer.server";
const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
for (let i = 0; i < 4; i++) {
  const r = await optimizeArticles(db as never, { limit: 5 });
  console.log(i, r.status, r.optimized, "remaining", r.remaining, r.failures.slice(0,1));
  if (r.remaining === 0 || r.status !== "ok") break;
}
