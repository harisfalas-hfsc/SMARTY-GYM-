/** Pure partner-share math. Amounts are integer cents. */
export const PARTNER_SHARE_RATE = 0.5;
export const PARTNER_VAT_RATE = 0.19;

/** Net = gross with VAT removed; partner share = net × share rate. */
export function partnerCommission(
  grossCents: number,
  shareRate: number = PARTNER_SHARE_RATE,
  vatRate: number = PARTNER_VAT_RATE,
): { netCents: number; commissionCents: number } {
  const gross = Math.max(0, Math.round(grossCents));
  const net = gross / (1 + vatRate);
  return { netCents: Math.round(net), commissionCents: Math.round(net * shareRate) };
}

const CODE_RE = /^[a-z0-9][a-z0-9_-]{1,30}$/;

/** Referral codes: lowercase letters, digits, - or _, 2–31 characters. */
export function normalizePartnerCode(input: string): string | null {
  const code = String(input ?? "").trim().toLowerCase();
  return CODE_RE.test(code) ? code : null;
}

/** Suggested code from a name or handle, e.g. "Nick Bare" → "nickbare". */
export function suggestPartnerCode(nameOrHandle: string): string {
  return String(nameOrHandle ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 24);
}

export function euros(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

/** Referral remembered in the browser for 30 days. */
export const REFERRAL_STORAGE_KEY = "smarty-ref";
export const REFERRAL_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
