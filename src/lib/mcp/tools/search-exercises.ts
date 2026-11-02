import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_exercises",
  title: "Search exercise library",
  description: "Search exercise names and read their library descriptions and instructions without changing records.",
  inputSchema: { query: z.string().min(1).max(100), limit: z.number().int().min(1).max(30).default(10) },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    const client = supabaseForUser(ctx);
    const { data, error } = await client.from("exercises")
      .select("id,slug,name,body_part,target_muscle,equipment,difficulty,description,instructions")
      .ilike("name", `%${query.replace(/[%_\\]/g, "\\$&")}%`).order("name").limit(limit);
    if (error) throw new ToolError("Exercise search is temporarily unavailable.");
    const exercises = (data ?? []).map(row => ({ ...row }));
    return { content: [{ type: "text", text: JSON.stringify(exercises) }], structuredContent: { exercises } };
  },
});