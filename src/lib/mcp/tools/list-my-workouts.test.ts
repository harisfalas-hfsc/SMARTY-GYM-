import { describe, expect, it, vi } from "vitest";
const rpc = vi.fn();
const from = vi.fn();
vi.mock("../supabase", () => ({ supabaseForUser: () => ({ rpc, from }) }));
vi.mock("@lovable.dev/mcp-js", () => ({ defineTool: (value: unknown) => value, ToolError: class extends Error {} }));
import tool from "./list-my-workouts";
describe("MCP workout access", () => {
  it("rejects inactive membership without reading workouts", async () => {
    rpc.mockResolvedValue({ data: false, error: null });
    const definition = tool as unknown as { handler: (args: { limit: number; offset: number }, ctx: { getUserId: () => string }) => Promise<unknown> };
    await expect(definition.handler({ limit: 20, offset: 0 }, { getUserId: () => "owner-id" })).rejects.toThrow("active SmartyGym membership");
    expect(rpc).toHaveBeenCalledWith("has_active_membership", { _user_id: "owner-id" });
    expect(from).not.toHaveBeenCalled();
  });
});