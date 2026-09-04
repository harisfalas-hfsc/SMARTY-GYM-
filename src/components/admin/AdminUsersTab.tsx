import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Loader2,
  Search,
  Shield,
  RefreshCw,
  ClipboardList,
  ArrowLeft,
  User,
  Gift,
  Ban,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  adminListUsers,
  adminSetRole,
  adminGrantPremium,
  adminRevokePremium,
  type AdminUserRow,
} from "@/lib/admin.functions";
import { AdminWorkoutsTab } from "@/components/admin/AdminWorkoutsTab";
import { AdminMemberDetail } from "@/components/admin/AdminMemberDetail";
import { formatDate } from "@/lib/date-format";
import { useFreeAccessMode } from "@/hooks/useFreeAccessMode";

type Filter = "all" | "subscriber" | "complimentary" | "member";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Everyone" },
  { key: "subscriber", label: "Paying subscribers" },
  { key: "complimentary", label: "Complimentary" },
  { key: "member", label: "Free members" },
];

export function AdminUsersTab() {
  const listUsers = useServerFn(adminListUsers);
  const setRole = useServerFn(adminSetRole);
  const grantPremium = useServerFn(adminGrantPremium);
  const revokePremium = useServerFn(adminRevokePremium);
  const { freeAccessMode } = useFreeAccessMode();

  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
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

  const counts = useMemo(
    () => ({
      all: users.length,
      subscriber: users.filter((u) => u.membership === "subscriber").length,
      complimentary: users.filter((u) => u.membership === "complimentary").length,
      member: users.filter((u) => u.membership === "member").length,
    }),
    [users],
  );

  const rows = filter === "all" ? users : users.filter((u) => u.membership === filter);

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

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.key}
            size="sm"
            variant={filter === f.key ? "default" : "outline"}
            onClick={() => setFilter(f.key)}
          >
            {f.label} ({counts[f.key]})
          </Button>
        ))}
      </div>

      {freeAccessMode && (
        <p className="rounded-2xl border border-amber-500 bg-amber-500/10 p-3 text-sm">
          Free Access Mode is ON — every signed-in member has full access right now, whatever their
          membership below says. Complimentary months you grant here stay recorded and take effect
          again the moment you switch paid mode back on.
        </p>
      )}

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
                  {u.membership === "subscriber" && (
                    <Badge className="gap-1">
                      <CreditCard className="h-3 w-3" /> Subscriber
                    </Badge>
                  )}
                  {u.membership === "complimentary" && (
                    <Badge variant="secondary" className="gap-1">
                      <Gift className="h-3 w-3" /> Complimentary
                    </Badge>
                  )}
                  {u.membership === "member" && <Badge variant="outline">Member (free)</Badge>}
                  {u.membership_status === "past_due" && (
                    <Badge variant="destructive">Payment failed</Badge>
                  )}
                  {u.wod_subscribed && <Badge variant="outline">WOD</Badge>}
                  {!u.profile_complete && <Badge variant="outline">No profile</Badge>}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                <span>Workouts: {u.workouts}</span>
                <span>Joined: {formatDate(u.created_at)}</span>
                <span>
                  {u.membership === "member"
                    ? "No active membership"
                    : `Access until: ${u.membership_until ? formatDate(u.membership_until) : "—"}`}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setDetailFor(u)}>
                  <User className="mr-1 h-4 w-4" /> Member profile
                </Button>
                <Button size="sm" variant="outline" onClick={() => setLogbookFor(u)}>
                  <ClipboardList className="mr-1 h-4 w-4" /> Workouts ({u.workouts})
                </Button>
                <span className="flex items-center gap-1 rounded-xl border p-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    aria-label="Fewer months"
                    disabled={busy || monthsFor(u.id) <= 1}
                    onClick={() => setMonths(u.id, monthsFor(u.id) - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="w-24 text-center text-sm font-semibold">
                    {monthsFor(u.id)} {monthsFor(u.id) === 1 ? "month" : "months"}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    aria-label="More months"
                    disabled={busy || monthsFor(u.id) >= 36}
                    onClick={() => setMonths(u.id, monthsFor(u.id) + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => {
                      const months = monthsFor(u.id);
                      void act(
                        () => grantPremium({ data: { userId: u.id, months } }),
                        `${months} complimentary ${months === 1 ? "month" : "months"} added — free access, no charge and no effect on revenue.`,
                      );
                    }}
                  >
                    <Gift className="mr-1 h-4 w-4" /> Give free access
                  </Button>
                </span>
                {u.membership !== "member" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() =>
                      act(
                        () => revokePremium({ data: { userId: u.id } }),
                        "Membership access removed in the app. Paid subscriptions must also be cancelled in the Revenue section.",
                      )
                    }
                  >
                    <Ban className="mr-1 h-4 w-4" /> Remove access
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
