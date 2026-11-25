import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, ExternalLink, FileDown, Loader2, Mail, Pencil, Plus, Trash2, UserPlus, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { AppConfirmDialog } from "@/components/ui/app-dialog";
import {
  adminCheckPartnerCode, adminCreatePartner, adminDeleteContact, adminListCollaborations, adminPartnerLedger,
  adminRecordPayout, adminSaveContact, adminSeedSuggestedContacts, adminUpdatePartner,
  type ContactRow, type LedgerEntry, type PartnerRow, type PayoutEntry,
} from "@/lib/partners/partners.functions";
import { euros, partnerCommission, suggestPartnerCode } from "@/lib/partners/commission";
import { invitationDm, invitationLetter, mailtoLink } from "@/lib/partners/invitation";
import { downloadPayoutReceipt } from "@/lib/partners/receipt";

const STATUSES: { key: string; label: string }[] = [
  { key: "to_contact", label: "To contact" },
  { key: "contacted", label: "Contacted" },
  { key: "in_discussion", label: "In discussion" },
  { key: "active_partner", label: "Active partner" },
  { key: "declined", label: "Declined" },
];
const statusLabel = (k: string) => STATUSES.find((s) => s.key === k)?.label ?? k;

function socialUrl(v: string | null, base: string) {
  if (!v) return null;
  if (/^https?:\/\//.test(v)) return v;
  return base + v.replace(/^@/, "");
}

function randomPassword() {
  const a = new Uint32Array(3);
  crypto.getRandomValues(a);
  return "Smarty-" + Array.from(a, (n) => n.toString(36)).join("").slice(0, 10);
}

async function copy(text: string, what: string) {
  try { await navigator.clipboard.writeText(text); toast.success(`${what} copied`); } catch { toast.error("Copy failed"); }
}

export function AdminCollaborationsTab() {
  const list = useServerFn(adminListCollaborations);
  const [data, setData] = useState<{ contacts: ContactRow[]; partners: PartnerRow[] } | null>(null);
  const [tab, setTab] = useState("contacts");
  const reload = () => list().then(setData).catch((e) => toast.error(e instanceof Error ? e.message : "Load failed"));
  useEffect(() => { void reload(); }, []);

  if (!data) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <Tabs value={tab} onValueChange={setTab} className="rounded-2xl border border-coach-line bg-card p-3 sm:p-4">
      <TabsList className="grid h-auto w-full grid-cols-3">
        <TabsTrigger value="contacts" className="py-2 font-bold">Contacts</TabsTrigger>
        <TabsTrigger value="invitations" className="py-2 font-bold">Invitations</TabsTrigger>
        <TabsTrigger value="partnerships" className="py-2 font-bold">Partnerships</TabsTrigger>
      </TabsList>
      <TabsContent value="contacts" className="mt-4"><ContactsPanel contacts={data.contacts} onChange={reload} /></TabsContent>
      <TabsContent value="invitations" className="mt-4"><InvitationsPanel contacts={data.contacts} partners={data.partners} /></TabsContent>
      <TabsContent value="partnerships" className="mt-4"><PartnershipsPanel partners={data.partners} contacts={data.contacts} onChange={reload} /></TabsContent>
    </Tabs>
  );
}

/* ---------------- Contacts ---------------- */
function ContactsPanel({ contacts, onChange }: { contacts: ContactRow[]; onChange: () => void }) {
  const save = useServerFn(adminSaveContact);
  const del = useServerFn(adminDeleteContact);
  const [editing, setEditing] = useState<Partial<ContactRow> | null>(null);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [removeId, setRemoveId] = useState<string | null>(null);
  const seed = useServerFn(adminSeedSuggestedContacts);
  const [enrollId, setEnrollId] = useState<string | null>(null);
  const shown = contacts.filter((c) => (filter === "all" || c.status === filter) && (!q || `${c.name} ${c.instagram ?? ""} ${c.niche ?? ""}`.toLowerCase().includes(q.toLowerCase())));

  async function setStatus(c: ContactRow, status: string) {
    const r = await save({ data: { id: c.id, name: c.name, status: status as never } });
    if ("error" in r && r.error) toast.error(r.error); else onChange();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Input placeholder="Search name, handle or niche" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All ({contacts.length})</option>
          {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label} ({contacts.filter((c) => c.status === s.key).length})</option>)}
        </select>
        <Button size="sm" onClick={() => setEditing({ status: "to_contact" })}><Plus className="mr-1 h-4 w-4" />Add creator</Button>
        {contacts.length === 0 && <Button size="sm" variant="outline" onClick={async () => { const r = await seed(); if ("error" in r && r.error) toast.error(r.error); else { toast.success(`${r.added ?? 0} creators added`); onChange(); } }}>Load 50 suggested creators</Button>}
      </div>
      <p className="text-xs text-muted-foreground">Emails are added by you from each creator's public business contact (Instagram “Email” button, bio or website).</p>
      <div className="grid gap-2 md:grid-cols-2">
        {shown.map((c) => (
          <div key={c.id} className="rounded-xl border border-coach-line bg-background/40 p-3">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold">{c.name}</p>
                <p className="truncate text-xs text-muted-foreground">{[c.niche, c.country, c.followers].filter(Boolean).join(" · ")}</p>
                <p className="truncate text-xs">{c.email || <span className="text-muted-foreground">No email yet</span>}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button size="icon" variant="ghost" onClick={() => setEditing(c)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => setRemoveId(c.id)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              {socialUrl(c.instagram, "https://instagram.com/") && <a className="text-primary" href={socialUrl(c.instagram, "https://instagram.com/")!} target="_blank" rel="noreferrer">Instagram</a>}
              {socialUrl(c.tiktok, "https://tiktok.com/@") && <a className="text-primary" href={socialUrl(c.tiktok, "https://tiktok.com/@")!} target="_blank" rel="noreferrer">TikTok</a>}
              {socialUrl(c.youtube, "https://youtube.com/@") && <a className="text-primary" href={socialUrl(c.youtube, "https://youtube.com/@")!} target="_blank" rel="noreferrer">YouTube</a>}
              {!c.partner_id && <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setEnrollId(c.id)}><UserPlus className="mr-1 h-3 w-3" />Create partner &amp; code</Button>}
              <select className="ml-auto h-7 rounded-md border border-input bg-background px-1 text-xs" value={c.status} onChange={(e) => void setStatus(c, e.target.value)}>
                {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogTitle>{editing?.id ? "Edit creator" : "Add creator"}</DialogTitle>
          <DialogDescription>Private contact details — never shown on the website.</DialogDescription>
          {editing && (
            <form className="space-y-2" onSubmit={async (e) => {
              e.preventDefault();
              const r = await save({ data: { ...(editing.id ? { id: editing.id } : {}), name: editing.name ?? "", email: editing.email ?? null, instagram: editing.instagram ?? null, tiktok: editing.tiktok ?? null, youtube: editing.youtube ?? null, country: editing.country ?? null, niche: editing.niche ?? null, followers: editing.followers ?? null, status: (editing.status ?? "to_contact") as never, notes: editing.notes ?? null } });
              if ("error" in r && r.error) return toast.error(r.error);
              setEditing(null); onChange();
            }}>
              {(["name", "email", "instagram", "tiktok", "youtube", "country", "niche", "followers"] as const).map((k) => (
                <Input key={k} required={k === "name"} placeholder={k[0]!.toUpperCase() + k.slice(1)} value={(editing[k] as string) ?? ""} onChange={(e) => setEditing({ ...editing, [k]: e.target.value })} />
              ))}
              <Textarea placeholder="Notes" value={editing.notes ?? ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
              <Button type="submit" className="w-full">Save</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <CreatePartnerDialog open={!!enrollId} onOpenChange={(o) => !o && setEnrollId(null)} contacts={contacts} initialContactId={enrollId ?? undefined} onCreated={onChange} />
      <AppConfirmDialog open={!!removeId} onOpenChange={(o) => !o && setRemoveId(null)} title="Delete this creator?" description="This removes the contact from your list." confirmLabel="Delete"
        onConfirm={async () => { if (removeId) { await del({ data: { id: removeId } }); setRemoveId(null); onChange(); } }} />
    </div>
  );
}

/* ---------------- Invitations ---------------- */
function InvitationsPanel({ contacts, partners }: { contacts: ContactRow[]; partners: PartnerRow[] }) {
  const options = useMemo(() => [
    ...partners.map((p) => ({ key: "p" + p.id, name: p.name, email: p.email, code: p.code })),
    ...contacts.filter((c) => !c.partner_id).map((c) => ({ key: "c" + c.id, name: c.name, email: c.email ?? "", code: undefined as string | undefined })),
  ], [contacts, partners]);
  const [sel, setSel] = useState(options[0]?.key ?? "");
  const pick = options.find((o) => o.key === sel) ?? { name: "[Name]", email: "", code: undefined };
  const base = invitationLetter({ name: pick.name, ...(pick.code ? { code: pick.code } : {}) });
  const baseDm = invitationDm(pick.name);
  const baseAgreement = agreementText(pick.name);
  const [subject, setSubject] = useState(base.subject);
  const [body, setBody] = useState(base.body);
  const [dm, setDm] = useState(baseDm);
  const [agreement, setAgreement] = useState(baseAgreement);
  function reset() { setSubject(base.subject); setBody(base.body); setDm(baseDm); setAgreement(baseAgreement); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(reset, [sel]);
  return (
    <div className="space-y-3">
      <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={sel} onChange={(e) => setSel(e.target.value)}>
        {options.map((o) => <option key={o.key} value={o.key}>{o.name}{o.code ? ` — partner (${o.code})` : ""}</option>)}
      </select>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" asChild disabled={!pick.email}><a href={mailtoLink(pick.email, subject, body)}><Mail className="mr-1 h-4 w-4" />Open in Outlook / Mail</a></Button>
        <Button size="sm" variant="outline" onClick={() => copy(`${subject}\n\n${body}`, "Email")}><Copy className="mr-1 h-4 w-4" />Copy email</Button>
        <Button size="sm" variant="outline" onClick={() => copy(dm, "Instagram DM")}><Copy className="mr-1 h-4 w-4" />Copy Instagram DM</Button>
        <Button size="sm" variant="ghost" onClick={reset}>Reset to original</Button>
      </div>
      {!pick.email && <p className="text-xs text-muted-foreground">Add this creator's email in Contacts to open it in your mail app.</p>}
      <p className="text-xs text-muted-foreground">Everything below is editable. Your changes are used by the copy and mail buttons.</p>
      <label className="block text-xs font-semibold">Subject
        <Input className="mt-1" value={subject} onChange={(e) => setSubject(e.target.value)} />
      </label>
      <label className="block text-xs font-semibold">Email
        <Textarea className="mt-1 min-h-[40vh] font-sans text-sm" value={body} onChange={(e) => setBody(e.target.value)} />
      </label>
      <label className="block text-xs font-semibold">Instagram DM
        <Textarea className="mt-1 min-h-28 text-sm" value={dm} onChange={(e) => setDm(e.target.value)} />
      </label>
      <div className="rounded-xl border border-coach-line p-3 text-sm">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <p className="min-w-0 font-semibold">Private partnership agreement (draft)</p>
          <Button size="sm" variant="outline" onClick={() => copy(agreement, "Agreement")}><Copy className="mr-1 h-4 w-4" />Copy agreement</Button>
        </div>
        <Textarea className="mt-2 min-h-[40vh] text-sm" value={agreement} onChange={(e) => setAgreement(e.target.value)} />
      </div>
    </div>
  );
}

function agreementText(name: string) {
  return `SmartyGym Partnership Agreement — between Haris Falas (SmartyGym) and ${name}

1. Share: 50% of net subscription revenue (€9.99 less 19% VAT = €8.40) from every member who joins through the partner's personal link — €4.20 per member per month.
2. Lifetime: the share continues on every renewal for as long as the member stays subscribed and this partnership remains active.
3. Reporting: the partner has a private dashboard with clicks, sign-ups, active members, renewals and payouts.
4. Payment: monthly, by bank transfer, PayPal or Revolut, with a payout statement. Refunded or failed payments earn no share.
5. Independence: the partner acts as an independent contractor responsible for their own taxes.
6. Conduct: the partner promotes SmartyGym honestly and only if they personally believe in it.
7. Either side may end the partnership by written notice; shares already earned are paid.

Signed for SmartyGym: ______________________   Date: __________
Haris Falas

Signed by partner: ______________________   Date: __________
${name}`;
}

/* ---------------- Partnerships ---------------- */
function PartnershipsPanel({ partners, contacts, onChange }: { partners: PartnerRow[]; contacts: ContactRow[]; onChange: () => void }) {
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState<PartnerRow | null>(null);
  const totals = partners.reduce((t, p) => ({ active: t.active + p.active, earned: t.earned + p.earnedCents, paid: t.paid + p.paidCents, month: t.month + p.monthCents }), { active: 0, earned: 0, paid: 0, month: 0 });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Active referred members" value={String(totals.active)} />
        <Stat label="Partner share this month" value={euros(totals.month)} />
        <Stat label="Total partner share" value={euros(totals.earned)} />
        <Stat label="Balance due" value={euros(totals.earned - totals.paid)} />
      </div>
      <Button size="sm" onClick={() => setCreating(true)}><UserPlus className="mr-1 h-4 w-4" />Add new partner</Button>
      {partners.length === 0 && <p className="text-sm text-muted-foreground">No partners yet. Add one to create their personal link and account.</p>}
      <div className="space-y-2">
        {partners.map((p) => (
          <div key={p.id} className="rounded-xl border border-coach-line bg-background/40 p-3">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold">{p.name} <Badge variant={p.status === "active" ? "default" : "outline"} className="ml-1">{p.status}</Badge></p>
                <p className="truncate text-xs text-muted-foreground">{p.email}</p>
                <button className="truncate text-xs text-primary" onClick={() => copy(`https://smartygym.com/?ref=${p.code}`, "Link")}>smartygym.com/?ref={p.code} <Copy className="inline h-3 w-3" /></button>
              </div>
              <Button size="sm" variant="outline" onClick={() => setOpen(p)}>Open</Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {p.click_count} clicks · {p.signups} sign-ups · {p.active} active · {p.renewals} renewals · earned {euros(p.earnedCents)} · paid {euros(p.paidCents)} · <strong className="text-foreground">due {euros(p.earnedCents - p.paidCents)}</strong>
            </p>
          </div>
        ))}
      </div>
      <CreatePartnerDialog open={creating} onOpenChange={setCreating} contacts={contacts} onCreated={onChange} />
      {open && <PartnerDetailDialog partner={open} onClose={() => setOpen(null)} onChange={onChange} />}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-coach-line p-3"><p className="text-[11px] text-muted-foreground">{label}</p><p className="text-lg font-extrabold">{value}</p></div>;
}

function CreatePartnerDialog({ open, onOpenChange, contacts, onCreated, initialContactId }: { open: boolean; onOpenChange: (o: boolean) => void; contacts: ContactRow[]; onCreated: () => void; initialContactId?: string | undefined }) {
  const create = useServerFn(adminCreatePartner);
  const check = useServerFn(adminCheckPartnerCode);
  const [f, setF] = useState({ contactId: "", name: "", email: "", code: "", instagram: "", tiktok: "", password: "" });
  const [codeMsg, setCodeMsg] = useState<string | null>(null);
  const [codeTouched, setCodeTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ name: string; email: string; code: string; password: string; createdAccount: boolean } | null>(null);

  useEffect(() => {
    if (!open) return;
    const c = initialContactId ? contacts.find((x) => x.id === initialContactId) : undefined;
    setF(c
      ? { contactId: c.id, name: c.name, email: c.email ?? "", code: suggestPartnerCode(c.instagram || c.name), instagram: c.instagram ?? "", tiktok: c.tiktok ?? "", password: randomPassword() }
      : { contactId: "", name: "", email: "", code: "", instagram: "", tiktok: "", password: randomPassword() });
    setDone(null); setCodeTouched(false); setCodeMsg(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialContactId]);
  useEffect(() => {
    if (!f.code) { setCodeMsg(null); return; }
    const t = setTimeout(() => { void check({ data: { code: f.code } }).then((r) => setCodeMsg(r.available ? "Available" : (r as { reason?: string }).reason ?? "Taken")); }, 300);
    return () => clearTimeout(t);
  }, [f.code, check]);

  function fromContact(id: string) {
    const c = contacts.find((x) => x.id === id);
    if (!c) return setF({ ...f, contactId: "" });
    setF({ ...f, contactId: id, name: c.name, email: c.email ?? "", instagram: c.instagram ?? "", tiktok: c.tiktok ?? "", code: codeTouched ? f.code : suggestPartnerCode(c.instagram || c.name) });
  }

  const letter = done ? invitationLetter({ name: done.name, code: done.code, ...(done.createdAccount ? { email: done.email, password: done.password } : {}) }) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogTitle>{done ? "Partner ready" : "Add new partner"}</DialogTitle>
        <DialogDescription>{done ? "Their link is live and their account has lifetime free access." : "Creates their personal link and a SmartyGym account with lifetime free access."}</DialogDescription>
        {done && letter ? (
          <div className="space-y-2 text-sm">
            <p>Link: <strong>https://smartygym.com/?ref={done.code}</strong></p>
            {done.createdAccount ? <p>Sign-in: {done.email} · temporary password <strong>{done.password}</strong></p> : <p>This email already had an account — it now has lifetime access and the Partner Dashboard.</p>}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" asChild><a href={mailtoLink(done.email, letter.subject, letter.body)}><Mail className="mr-1 h-4 w-4" />Open in Outlook / Mail</a></Button>
              <Button size="sm" variant="outline" onClick={() => copy(`${letter.subject}\n\n${letter.body}`, "Letter")}><Copy className="mr-1 h-4 w-4" />Copy letter</Button>
            </div>
          </div>
        ) : (
          <form className="space-y-2" onSubmit={async (e) => {
            e.preventDefault(); setBusy(true);
            try {
              const r = await create({ data: { name: f.name, email: f.email, code: f.code, password: f.password, instagram: f.instagram || null, tiktok: f.tiktok || null, ...(f.contactId ? { contactId: f.contactId } : {}) } });
              if ("error" in r) return void toast.error(r.error);
              setDone({ name: f.name, email: f.email.trim().toLowerCase(), code: r.code, password: f.password, createdAccount: r.createdAccount }); onCreated();
            } finally { setBusy(false); }
          }}>
            <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={f.contactId} onChange={(e) => fromContact(e.target.value)}>
              <option value="">From Contacts (optional)</option>
              {contacts.filter((c) => !c.partner_id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Input required placeholder="Full name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value, code: codeTouched ? f.code : suggestPartnerCode(e.target.value) })} />
            <Input required type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            <Input placeholder="Instagram (optional)" value={f.instagram} onChange={(e) => setF({ ...f, instagram: e.target.value })} />
            <Input placeholder="TikTok (optional)" value={f.tiktok} onChange={(e) => setF({ ...f, tiktok: e.target.value })} />
            <div>
              <Input required placeholder="Referral code" value={f.code} onChange={(e) => { setCodeTouched(true); setF({ ...f, code: e.target.value.toLowerCase().replace(/\s/g, "") }); }} />
              <p className={`mt-1 text-xs ${codeMsg === "Available" ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>{f.code ? `smartygym.com/?ref=${f.code} — ${codeMsg ?? "checking…"}` : ""}</p>
            </div>
            <Input required minLength={8} placeholder="Temporary password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
            <Button type="submit" className="w-full" disabled={busy || codeMsg !== "Available"}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save & generate</Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PartnerDetailDialog({ partner, onClose, onChange }: { partner: PartnerRow; onClose: () => void; onChange: () => void }) {
  const ledger = useServerFn(adminPartnerLedger);
  const update = useServerFn(adminUpdatePartner);
  const pay = useServerFn(adminRecordPayout);
  const [d, setD] = useState<{ commissions: LedgerEntry[]; payouts: PayoutEntry[]; members: { joined: string; email: string; name: string | null }[] } | null>(null);
  const [code, setCode] = useState(partner.code);
  const [kit, setKit] = useState(partner.media_kit_url ?? "");
  const due = partner.earnedCents - partner.paidCents;
  const [payForm, setPayForm] = useState({ amount: (Math.max(0, due) / 100).toFixed(2), method: "Bank transfer", reference: "", period: new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" }) });
  const load = () => ledger({ data: { partnerId: partner.id } }).then(setD);
  useEffect(() => { void load(); }, []);

  async function saveSettings(patch: { id: string; code?: string; status?: "active" | "paused" | "ended"; media_kit_url?: string | null }) {
    const r = await update({ data: patch });
    if ("error" in r && r.error) toast.error(r.error); else { toast.success("Saved"); onChange(); }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogTitle>{partner.name}</DialogTitle>
        <DialogDescription>Per member: {euros(999)} − 19% VAT = {euros(partnerCommission(999).netCents)} net → partner {euros(partnerCommission(999).commissionCents)} every paid month.</DialogDescription>
        <div className="space-y-4 text-sm">
          <section className="space-y-2">
            <p className="font-semibold">Link & settings</p>
            <div className="flex gap-2"><Input value={code} onChange={(e) => setCode(e.target.value.toLowerCase())} /><Button size="sm" variant="outline" onClick={() => saveSettings({ id: partner.id, code })}>Save code</Button></div>
            <div className="flex gap-2"><Input placeholder="Media kit link (Google Drive, Dropbox…)" value={kit} onChange={(e) => setKit(e.target.value)} /><Button size="sm" variant="outline" onClick={() => saveSettings({ id: partner.id, media_kit_url: kit })}>Save</Button></div>
            <select className="h-9 rounded-md border border-input bg-background px-2" defaultValue={partner.status} onChange={(e) => saveSettings({ id: partner.id, status: e.target.value as never })}>
              <option value="active">Active</option><option value="paused">Paused (link stops counting)</option><option value="ended">Ended</option>
            </select>
          </section>
          <section className="space-y-2 rounded-xl border border-coach-line p-3">
            <p className="font-semibold"><Wallet className="mr-1 inline h-4 w-4" />Record payout — balance due {euros(due)}</p>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Amount €" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} />
              <Input placeholder="Method" value={payForm.method} onChange={(e) => setPayForm({ ...payForm, method: e.target.value })} />
              <Input placeholder="Transaction reference" value={payForm.reference} onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })} />
              <Input placeholder="Period" value={payForm.period} onChange={(e) => setPayForm({ ...payForm, period: e.target.value })} />
            </div>
            <Button size="sm" onClick={async () => {
              const cents = Math.round(Number(payForm.amount.replace(",", ".")) * 100);
              if (!Number.isFinite(cents) || cents <= 0) return toast.error("Enter an amount");
              const r = await pay({ data: { partnerId: partner.id, amountCents: cents, method: payForm.method, reference: payForm.reference || null, periodLabel: payForm.period || null } });
              if ("error" in r && r.error) return toast.error(r.error);
              toast.success("Payout recorded"); onChange(); void load();
            }}>Save payout</Button>
          </section>
          <section>
            <p className="font-semibold">Payouts</p>
            {d?.payouts.length ? d.payouts.map((p) => (
              <div key={p.id} className="flex items-center justify-between border-b border-coach-line py-1">
                <span>{new Date(p.paid_at).toLocaleDateString("en-GB")} · {euros(p.amount_cents)} · {p.method}</span>
                <Button size="sm" variant="ghost" onClick={() => downloadPayoutReceipt({ partnerName: partner.name, partnerCode: partner.code, receiptNumber: p.receipt_number, paidAt: p.paid_at, amountCents: p.amount_cents, method: p.method, reference: p.reference, periodLabel: p.period_label })}><FileDown className="mr-1 h-4 w-4" />Receipt</Button>
              </div>
            )) : <p className="text-muted-foreground">None yet.</p>}
          </section>
          <section>
            <p className="font-semibold">Members from this partner ({d?.members.length ?? 0})</p>
            <div className="max-h-40 overflow-y-auto">{d?.members.map((m, i) => <p key={i} className="text-xs">{new Date(m.joined).toLocaleDateString("en-GB")} · {m.name ? `${m.name} · ` : ""}{m.email}</p>)}</div>
          </section>
          <section>
            <p className="font-semibold">Ledger</p>
            <div className="max-h-48 overflow-y-auto">{d?.commissions.length ? d.commissions.map((c) => (
              <p key={c.id} className="text-xs">{new Date(c.paid_at).toLocaleDateString("en-GB")} · {c.kind === "new" ? "New subscriber" : "Renewal"} · {euros(c.gross_cents)} → +{euros(c.commission_cents)}{c.environment !== "live" ? " (test)" : ""}</p>
            )) : <p className="text-muted-foreground">No paid invoices yet.</p>}</div>
          </section>
          <a className="inline-flex items-center text-xs text-primary" href={`https://smartygym.com/?ref=${partner.code}`} target="_blank" rel="noreferrer"><ExternalLink className="mr-1 h-3 w-3" />Open their link</a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
