/**
 * One place for the site-wide SEO constants every generator uses
 * (head builder, sitemaps, llms.txt, IndexNow).
 */
export const SITE_URL = "https://smartygym.com";
export const SITE_NAME = "SmartyGym";
export const OG_IMAGE = `${SITE_URL}/og-social.jpg`;
export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const SOFTWARE_ID = `${SITE_URL}/#software`;

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
