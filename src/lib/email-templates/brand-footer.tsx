import React from "react";
import { Link, Section, Text } from "@react-email/components";
import { EMAIL_BRAND_LINES, EMAIL_SITE_LABEL, EMAIL_SITE_URL, emailBrandStyles } from "../email-brand";

export function EmailBrandFooter() {
  return (
    <Section data-email-brand-footer="true" style={emailBrandStyles.section}>
      <Text style={emailBrandStyles.brand}>{EMAIL_BRAND_LINES[0]}</Text>
      <Text style={emailBrandStyles.motto}>{EMAIL_BRAND_LINES[1]}</Text>
      <Text style={emailBrandStyles.motto}>{EMAIL_BRAND_LINES[2]}</Text>
      <Text style={emailBrandStyles.linkLine}>
        <Link href={EMAIL_SITE_URL} style={emailBrandStyles.link}>{EMAIL_SITE_LABEL}</Link>
      </Text>
    </Section>
  );
}
