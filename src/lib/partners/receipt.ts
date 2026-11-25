import { euros } from "./commission";

export type ReceiptInput = {
  partnerName: string; partnerCode: string; receiptNumber: string; paidAt: string;
  amountCents: number; method: string; reference: string | null; periodLabel: string | null;
};

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Readable text PDF payout statement, generated in the browser. */
export async function downloadPayoutReceipt(r: ReceiptInput) {
  const { contentPdfDocument } = await import("@/lib/content-pdf");
  const date = new Date(r.paidAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const html = `
    <p><strong>Receipt number:</strong> ${esc(r.receiptNumber)}</p>
    <p><strong>Date paid:</strong> ${esc(date)}</p>
    <p><strong>Paid to:</strong> ${esc(r.partnerName)} (partner code ${esc(r.partnerCode)})</p>
    ${r.periodLabel ? `<p><strong>Period:</strong> ${esc(r.periodLabel)}</p>` : ""}
    <p><strong>Amount paid:</strong> ${esc(euros(r.amountCents))}</p>
    <p><strong>Payment method:</strong> ${esc(r.method)}</p>
    ${r.reference ? `<p><strong>Transaction reference:</strong> ${esc(r.reference)}</p>` : ""}
    <p>Partner share of net subscription revenue (membership price less 19% VAT), as agreed in the private partnership agreement.</p>
    <p>Issued by SmartyGym · Haris Falas · smartygym.com</p>`;
  const blob = await contentPdfDocument(
    [{ title: "Partner Payout Statement", subtitle: "SmartyGym Collaborations", sections: [{ html }] }],
    "Partner Payout Statement",
  );
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${r.receiptNumber}.pdf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
}
