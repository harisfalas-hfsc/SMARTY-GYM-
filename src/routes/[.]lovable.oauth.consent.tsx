import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({ authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "" }),
  head: () => ({ meta: [
    { title: "Connect your assistant — SMARTYGYM" },
    { name: "description", content: "Approve or decline secure assistant access to your SMARTYGYM account." },
    { property: "og:title", content: "Connect your assistant — SMARTYGYM" },
    { property: "og:description", content: "Manage permission for an assistant to read your SMARTYGYM account." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("This connection request is missing or expired. Start again from your assistant.");
    const { data, error } = await supabase.auth.getSession();
    if (error) throw new Error("Unable to check your account. Please try again.");
    if (!data.session) throw redirect({ to: "/auth", search: { next: location.pathname + location.searchStr + location.hash } });
  },
  loader: async ({ location }) => {
    const id = new URLSearchParams(location.searchStr).get("authorization_id");
    if (!id) throw new Error("Start a new connection request from your assistant.");
    const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(id);
    if (error || !data) throw new Error("This connection request could not be loaded. It may have expired; start again from your assistant.");
    if ("redirect_url" in data && data.redirect_url) throw redirect({ href: data.redirect_url });
    const { data: session } = await supabase.auth.getSession();
    return { details: data, account: session.session?.user.email ?? "Your account" };
  },
  pendingComponent: () => <main className="mx-auto max-w-lg px-5 py-12" role="status">Loading connection request…</main>,
  errorComponent: ({ error }) => <main className="mx-auto max-w-lg space-y-4 px-5 py-12"><h1 className="text-2xl font-bold">Connection unavailable</h1><p role="alert">{error instanceof Error ? error.message : "Please start a new connection request."}</p><Button onClick={() => window.location.reload()}>Try again</Button></main>,
  component: Consent,
});

function Consent() {
  const { details, account } = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!("client" in details)) return <main className="mx-auto max-w-lg px-5 py-12">Returning to your assistant…</main>;
  const clientName = details.client.name || "Your assistant";
  const scopes = details.scope.split(" ").filter(Boolean);
  async function decide(approve: boolean) {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const result = approve
        ? await supabase.auth.oauth.approveAuthorization(authorization_id)
        : await supabase.auth.oauth.denyAuthorization(authorization_id);
      if (result.error) throw result.error;
      const target = result.data?.redirect_url;
      if (!target) throw new Error("The connection did not return a destination. Please try again.");
      window.location.assign(target);
    } catch {
      setError(approve ? "Approval failed. No connection was confirmed; please try again." : "Cancellation failed. Please try again.");
      setBusy(false);
    }
  }
  return <main className="mx-auto max-w-lg space-y-5 px-5 py-12">
    <h1 className="text-2xl font-bold">Connect {clientName} to SMARTYGYM</h1>
    <p className="break-words text-sm text-muted-foreground">Signed in as {account}</p>
    <p>This lets {clientName} use this app as you.</p>
    <p className="break-all text-sm text-muted-foreground">{details.redirect_uri}</p>
    <ul className="list-disc space-y-2 pl-5">
      {scopes.map(scope => <li key={scope}>{scope === "email" ? "Share your email address" : scope === "profile" ? "Share your basic profile" : scope === "openid" ? "Verify your identity" : `Additional permission requested: ${scope}`}</li>)}
      <li>Search exercise descriptions and instructions.</li>
      <li>Read your own workout summaries with an active membership.</li>
    </ul>
    <p className="text-sm text-muted-foreground">This does not bypass SMARTYGYM permissions or membership restrictions. Your workouts and history cannot be changed.</p>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex flex-wrap gap-3"><Button disabled={busy} onClick={() => void decide(true)}>Approve connection</Button><Button variant="outline" disabled={busy} onClick={() => void decide(false)}>Cancel connection</Button></div>
  </main>;
}