import React from "react";
import { render } from "@react-email/render";
import { describe, expect, it } from "vitest";
import { TEMPLATES } from "./email-templates/registry";
import Signup from "./email-templates/signup";
import Invite from "./email-templates/invite";
import MagicLink from "./email-templates/magic-link";
import Recovery from "./email-templates/recovery";
import EmailChange from "./email-templates/email-change";
import Reauthentication from "./email-templates/reauthentication";
import { EMAIL_BRAND_FOOTER, EMAIL_BRAND_LINES, EMAIL_SITE_URL } from "./email-brand";

const authData = {
  siteName: "SMARTYGYM", siteUrl: EMAIL_SITE_URL,
  recipient: "member@example.com", oldEmail: "old@example.com",
  email: "member@example.com", newEmail: "new@example.com",
  confirmationUrl: `${EMAIL_SITE_URL}/auth`, token: "123456",
};
const authTemplates = { Signup, Invite, MagicLink, Recovery, EmailChange, Reauthentication };

function checkFooter(html: string) {
  expect(html.match(/data-email-brand-footer="true"/g)).toHaveLength(1);
  const footer = html.slice(html.indexOf('data-email-brand-footer="true"'));
  let previous = -1;
  for (const line of [...EMAIL_BRAND_LINES, "smartygym.com"]) {
    const index = footer.indexOf(line);
    expect(index).toBeGreaterThan(previous);
    previous = index;
  }
  expect(footer).toContain("text-align:center");
  expect(footer).toContain(`href="${EMAIL_SITE_URL}"`);
  expect(footer).not.toMatch(/CSCS|EXOS|BSc|Yours in good health|Designed by|Fitness Partner/);
}

describe("consistent email brand signature", () => {
  it("uses the same centered signature in raw HTML", () => checkFooter(EMAIL_BRAND_FOOTER));
  for (const [name, template] of Object.entries(TEMPLATES)) {
    it(`renders the signature in ${name}`, async () => {
      const element = React.createElement(template.component, template.previewData ?? {});
      const html = await render(element);
      checkFooter(html);
      const text = await render(element, { plainText: true });
      for (const line of EMAIL_BRAND_LINES) expect(text).toContain(line);
      expect(text).not.toMatch(/CSCS|EXOS|BSc|Yours in good health/);
    });
  }
  for (const [name, component] of Object.entries(authTemplates)) {
    it(`renders the signature in account email ${name}`, async () => {
      checkFooter(await render(React.createElement(component as React.ComponentType<typeof authData>, authData)));
    });
  }
});