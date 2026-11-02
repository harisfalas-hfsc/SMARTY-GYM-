import { describe, expect, it } from "vitest";
import { oauthReturnPath } from "./oauth-return-path";
describe("OAuth return path", () => {
  it("preserves the complete consent request", () => {
    expect(oauthReturnPath("/.lovable/oauth/consent?authorization_id=abc#decision")).toBe("/.lovable/oauth/consent?authorization_id=abc#decision");
  });
  it.each(["//outside.invalid", "/\\outside.invalid", "/\noutside.invalid", "https://outside.invalid", null])("rejects external or unsafe path %s", value => {
    expect(oauthReturnPath(value)).toBe("/");
  });
});