import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_workouts",
  title: "List my workout summaries",
  description: "Read the connected member's saved workout summaries; active membership is required and training history is never changed.",
  inputSchema: { limit: z.number().int().min(1).max(50).default(20), offset: z.number().int().min(0).max(10000).default(0) },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, offset }, ctx) => {
    const client = supabaseForUser(ctx);
    const userId = ctx.getUserId();
    if (!userId) throw new ToolError("Sign in to connect your account.");
    const { data: membership, error: membershipError } = await client.rpc("has_active_membership", { _user_id: userId });
    if (membershipError || membership !== true) throw new ToolError("An active SmartyGym membership is required. Your saved data is kept.");
    const { data, error } = await client.from("workouts")
      .select("id,name,category,format,status,created_at,completed_at,duration_min")
      .eq("user_id", userId).is("deleted_at", null)
      .order("created_at", { ascending: false }).order("id").range(offset, offset + limit - 1);
    if (error) throw new ToolError("Your workout summaries are temporarily unavailable.");
    const workouts = (data ?? []).map(row => ({ ...row }));
    return { content: [{ type: "text", text: JSON.stringify(workouts) }], structuredContent: { workouts } };
  },
});