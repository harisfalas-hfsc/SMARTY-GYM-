/** Shared signature for every outgoing email format. */
export const EMAIL_BRAND_LINES = ["SMARTYGYM", "Your Gym Reimagined", "Anytime, Anywhere."] as const;
export const EMAIL_SITE_URL = "https://smartygym.com";
export const EMAIL_SITE_LABEL = "smartygym.com";
export const emailBrandStyles = {
  section: { textAlign: "center" as const, padding: "20px 0 8px", fontFamily: "Arial, Helvetica, sans-serif" },
  brand: { margin: "0 0 8px", fontSize: "16px", lineHeight: "24px", fontWeight: 700 as const, color: "#1193c7" },
  motto: { margin: "0", fontSize: "13px", lineHeight: "22px", color: "#666666" },
  linkLine: { margin: "12px 0 0", fontSize: "13px", lineHeight: "22px" },
  link: { color: "#1193c7", textDecoration: "none", fontWeight: 600 as const },
};
export const EMAIL_BRAND_FOOTER = `<table data-email-brand-footer="true" role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="text-align:center;padding:20px 0 8px;font-family:Arial,Helvetica,sans-serif;">
<p style="margin:0 0 8px;font-size:16px;line-height:24px;font-weight:700;color:#1193c7;">${EMAIL_BRAND_LINES[0]}</p>
<p style="margin:0;font-size:13px;line-height:22px;color:#666666;">${EMAIL_BRAND_LINES[1]}</p>
<p style="margin:0;font-size:13px;line-height:22px;color:#666666;">${EMAIL_BRAND_LINES[2]}</p>
<p style="margin:12px 0 0;font-size:13px;line-height:22px;"><a href="${EMAIL_SITE_URL}" style="color:#1193c7;text-decoration:none;font-weight:600;">${EMAIL_SITE_LABEL}</a></p>
</td></tr></table>`;
