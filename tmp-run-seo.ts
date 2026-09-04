import { runSeoRefresh } from "@/lib/cron/seo-refresh.server";
const r = await runSeoRefresh({ trigger: "manual" } as never);
console.log(JSON.stringify(r, null, 2).slice(0, 1500));
