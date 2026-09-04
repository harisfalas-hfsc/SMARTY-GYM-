import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Search, Shield, Plus, Minus, RefreshCw, ClipboardList, ArrowLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  adminListUsers,
  adminGrantCredits,
  adminSetRole,
  type AdminUserRow,
} from "@/lib/admin.functions";
import { AdminWorkoutsTab } from "@/components/admin/AdminWorkoutsTab";
import { AdminMemberDetail } from "@/components/admin/AdminMemberDetail";
import { formatDate } from "@/lib/date-format";

export function AdminUsersTab() {
  const listUsers = useServerFn(adminListUsers);
  const grantCredits = useServerFn(adminGrantCredits);
  const setRole = useServerFn(adminSetRole);

  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [logbookFor, setLogbookFor] = useState<AdminUserRow | null>(null);
  const [detailFor, setDetailFor] = useState<AdminUserRow | null>(null);

  async function reload() {
    setLoading(true);
    const r = await listUsers({ data: { search: search.trim() || undefined } });
    if ("error" in r) setMessage(r.error);
    else setUsers(r.users);
    setLoading(false);
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = users;

  async function act(fn: () => Promise<{ error?: string } | unknown>, ok: string) {
    setBusy(true);
    const r = (await fn()) as { error?: string };
    setBusy(false);
    setMessage(r?.error ?? ok);
    await reload();
  }

  if (detailFor) {
    return <AdminMemberDetail userId={detailFor.id} onBack={() => setDetailFor(null)} />;
  }

  if (logbookFor) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setLogbookFor(null)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to members
        </Button>
        <AdminWorkoutsTab
          userId={logbookFor.id}
          title={`Workouts — ${logbookFor.name || logbookFor.email}`}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && reload()}
            placeholder="Search by email or name"
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={() => void reload()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No members found.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((u) => (
            <div key={u.id} className="rounded-2xl border-2 border-blue-400 bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{u.name || "No name"}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {u.is_admin && (
                    <Badge variant="secondary" className="gap-1">
                      <Shield className="h-3 w-3" /> Admin
                    </Badge>
                  )}
                  <Badge variant="outline">Member</Badge>
                  {u.wod_subscribed && <Badge variant="outline">WOD</Badge>}
                  {!u.profile_complete && <Badge variant="outline">No profile</Badge>}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                <span>Workouts: {u.workouts}</span>
                <span>Credits: {u.credits}</span>
                <span>Joined: {formatDate(u.created_at)}</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setDetailFor(u)}>
                  <User className="mr-1 h-4 w-4" /> Member profile
                </Button>
                <Button size="sm" variant="outline" onClick={() => setLogbookFor(u)}>
                  <ClipboardList className="mr-1 h-4 w-4" /> Workouts ({u.workouts})
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    act(
                      () => setRole({ data: { userId: u.id, makeAdmin: !u.is_admin } }),
                      u.is_admin ? "Admin access removed." : "Admin access granted.",
                    )
                  }
                >
                  <Shield className="mr-1 h-4 w-4" />
                  {u.is_admin ? "Remove admin" : "Make admin"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() =>
                    act(() => grantCredits({ data: { userId: u.id, credits: 1 } }), "Credit added.")
                  }
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() =>
                    act(
                      () => grantCredits({ data: { userId: u.id, credits: -1 } }),
                      "Credit removed.",
                    )
                  }
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
