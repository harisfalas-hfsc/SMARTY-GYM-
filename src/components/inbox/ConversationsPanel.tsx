import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Mail,
  MailOpen,
  MessageSquare,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { AppConfirmDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteMyThreads,
  listMyThreads,
  replyToThread,
  setThreadsRead,
  submitMemberMessage,
  type SupportThread,
} from "@/lib/support.functions";
import { useAuth } from "@/hooks/useAuth";
import { loadRemote } from "@/lib/remote-data";
import { announceInboxChanged } from "@/lib/inbox-sync";
import { useOnlineStatus } from "@/lib/connectivity";
import { formatDateTime } from "@/lib/date-format";

function when(iso: string) {
  return formatDateTime(iso);
}

export function ConversationsPanel({
  onUnread,
  defaultComposing,
}: {
  onUnread?: (n: number) => void;
  defaultComposing?: boolean;
}) {
  const load = useServerFn(listMyThreads);
  const reply = useServerFn(replyToThread);
  const start = useServerFn(submitMemberMessage);
  const setRead = useServerFn(setThreadsRead);
  const removeThreads = useServerFn(deleteMyThreads);
  const { user } = useAuth();
  const online = useOnlineStatus();

  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newBody, setNewBody] = useState("");
  const [composing, setComposing] = useState(Boolean(defaultComposing));
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<string[] | null>(null);

  const reload = useCallback(async () => {
    try {
      const res = await loadRemote("inbox:threads", () => load({}), user?.id);
      setThreads(res.threads);
    } finally {
      setLoading(false);
    }
  }, [load, user?.id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const unread = useMemo(() => threads.filter((t) => t.user_unread).length, [threads]);
  const visibleThreads = useMemo(
    () =>
      threads
        .filter((t) => (unreadOnly ? t.user_unread : true))
        .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()),
    [threads, unreadOnly],
  );
  const visibleIds = useMemo(() => visibleThreads.map((t) => t.id), [visibleThreads]);
  const picked = useMemo(() => visibleIds.filter((id) => selected.has(id)), [visibleIds, selected]);
  const allPicked = visibleIds.length > 0 && picked.length === visibleIds.length;
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () => setSelected(allPicked ? new Set() : new Set(visibleIds));

  useEffect(() => {
    onUnread?.(unread);
    announceInboxChanged({ messagesUnread: unread });
  }, [unread, onUnread]);

  async function openThread(t: SupportThread) {
    setOpenId((cur) => (cur === t.id ? null : t.id));
    setDraft("");
    if (t.user_unread) {
      setThreads((prev) => prev.map((x) => (x.id === t.id ? { ...x, user_unread: false } : x)));
      announceInboxChanged({ readMessageIds: [t.id] });
      try {
        await setRead({ data: { ids: [t.id], read: true } });
        announceInboxChanged();
      } catch {
        toast.error("Could not update that conversation.");
      }
    }
  }

  async function sendReply(id: string) {
    if (!draft.trim()) return;
    if (!online) return toast.error("You must be online to send a message.");
    setBusy(true);
    const res = await reply({ data: { threadId: id, body: draft } }).catch(() => ({ ok: false }));
    setBusy(false);
    if (!res.ok) return toast.error("Could not send your reply.");
    setDraft("");
    toast.success("Reply sent");
    void reload();
  }

  async function sendNew() {
    if (!newBody.trim()) return;
    if (!online) return toast.error("You must be online to send a message.");
    setBusy(true);
    const res = await start({ data: { subject: newSubject, message: newBody } }).catch(() => ({
      ok: false as const,
    }));
    setBusy(false);
    if (!res.ok) return toast.error("Could not send your message.");
    setNewSubject("");
    setNewBody("");
    setComposing(false);
    toast.success("Message sent — we reply within 24–48 hours.");
    void reload();
  }

  async function bulkRead(read: boolean, ids = picked) {
    if (!ids.length) return;
    setThreads((prev) => prev.map((t) => (ids.includes(t.id) ? { ...t, user_unread: !read } : t)));
    setSelected(new Set());
    announceInboxChanged(read ? { readMessageIds: ids } : { unreadMessageIds: ids });
    try {
      await setRead({ data: { ids, read } });
      announceInboxChanged();
      toast.success(`${ids.length} marked as ${read ? "read" : "unread"}`);
    } catch {
      toast.error("Could not update those conversations.");
      void reload();
    }
  }

  async function doDelete() {
    const ids = confirm ?? [];
    setConfirm(null);
    if (!ids.length) return;
    setThreads((prev) => prev.filter((t) => !ids.includes(t.id)));
    setSelected(new Set());
    if (openId && ids.includes(openId)) setOpenId(null);
    announceInboxChanged({ removedMessageIds: ids });
    try {
      await removeThreads({ data: { ids } });
      announceInboxChanged();
      toast.success(`${ids.length} conversation${ids.length === 1 ? "" : "s"} deleted`);
    } catch {
      toast.error("Could not delete those conversations.");
      void reload();
    }
  }

  return (
    <div>
      <Button
        variant={composing ? "secondary" : "default"}
        onClick={() => setComposing((v) => !v)}
        className="mb-3 h-10 w-full rounded-2xl"
        aria-pressed={composing}
      >
        <MessageSquare className="mr-2 h-4 w-4" /> {composing ? "Cancel" : "Write to the team"}
      </Button>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setUnreadOnly(false)}
          className={`flex h-10 items-center justify-center rounded-2xl text-sm font-bold ${
            unreadOnly ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"
          }`}
        >
          All ({threads.length})
        </button>
        <button
          type="button"
          onClick={() => setUnreadOnly(true)}
          className={`flex h-10 items-center justify-center rounded-2xl text-sm font-bold ${
            unreadOnly ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
          }`}
        >
          Unread ({unread})
        </button>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border-2 border-blue-400 bg-background p-2">
        <div
          className={`flex h-9 shrink-0 items-center gap-2 rounded-xl px-2 text-xs font-bold ${
            visibleIds.length ? "" : "pointer-events-none opacity-40"
          }`}
        >
          <Checkbox checked={allPicked} onCheckedChange={toggleAll} aria-label="Select all" disabled={!visibleIds.length} />
          <button type="button" onClick={toggleAll} className="whitespace-nowrap">
            {picked.length ? `${picked.length} selected` : "Select all"}
          </button>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <button type="button" disabled={!picked.length} onClick={() => bulkRead(true)} aria-label="Mark selected as read" className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-secondary-foreground disabled:opacity-40">
            <MailOpen className="h-4 w-4" />
          </button>
          <button type="button" disabled={!picked.length} onClick={() => bulkRead(false)} aria-label="Mark selected as unread" className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-secondary-foreground disabled:opacity-40">
            <Mail className="h-4 w-4" />
          </button>
          <button type="button" disabled={!picked.length} onClick={() => setConfirm(picked)} aria-label="Delete selected" className="grid h-10 w-10 place-items-center rounded-xl bg-destructive/10 text-destructive disabled:opacity-40">
            <Trash2 className="h-4 w-4" />
          </button>
          {picked.length > 0 && (
            <button type="button" onClick={() => setSelected(new Set())} aria-label="Clear selection" className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-secondary-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {composing && (
        <div className="mb-5 space-y-3 rounded-2xl border-2 border-primary bg-card p-4">
          <p className="text-sm text-muted-foreground">Ask a question or report a problem. Our reply will appear here in Messages.</p>
          <Input
            placeholder="Subject"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            maxLength={200}
          />
          <Textarea
            rows={5}
            placeholder="How can we help?"
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            maxLength={5000}
            className="resize-none"
          />
          <Button
            onClick={sendNew}
            disabled={busy || !newBody.trim()}
            className="w-full rounded-2xl"
          >
            {busy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Send message
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : visibleThreads.length === 0 ? (
        <p className="rounded-2xl border-2 border-blue-400 p-8 text-center text-sm text-muted-foreground">
          {threads.length
            ? "No messages match this filter."
            : "No conversations yet. Tap \"Write to the team\" to send us a message."}
        </p>
      ) : (
        <ul className="space-y-2">
          {visibleThreads.map((t) => {
            const open = openId === t.id;
            const messages = t.messages ?? [];
            const latestQuestion = [...messages]
              .reverse()
              .find((message) => message.sender === "user");
            const latestReply = [...messages]
              .reverse()
              .find((message) => message.sender === "admin");
            return (
              <li
                key={t.id}
                className={`overflow-hidden rounded-2xl border transition ${
                  selected.has(t.id)
                    ? "border-primary bg-primary/10"
                    : t.user_unread
                      ? "border-primary/40 bg-primary/[0.04]"
                      : "border-border bg-background"
                }`}
              >
                <div className="flex items-start gap-3 p-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center">
                  <Checkbox checked={selected.has(t.id)} onCheckedChange={() => toggleOne(t.id)} aria-label="Select conversation" />
                </div>
                <button
                  type="button"
                  onClick={() => openThread(t)}
                  className="flex min-w-0 flex-1 items-start gap-3 text-left"
                  aria-expanded={open}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">
                      {t.user_unread && <span className="mr-1 text-primary">•</span>}
                      {t.subject}
                    </span>
                    {!open && latestQuestion && (
                      <span className="mt-1 block line-clamp-1 text-xs text-muted-foreground">
                        <strong className="text-foreground">You:</strong> {latestQuestion.body}
                      </span>
                    )}
                    {!open && latestReply && (
                      <span className="block line-clamp-1 text-xs text-muted-foreground">
                        <strong className="text-primary">Reply:</strong> {latestReply.body}
                      </span>
                    )}
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      {when(t.last_message_at)} · {messages.length}{" "}
                      {messages.length === 1 ? "message" : "messages"}
                    </span>
                  </span>
                  {open ? (
                    <ChevronUp className="mt-1 h-4 w-4 shrink-0 text-primary" />
                  ) : (
                    <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-primary" />
                  )}
                </button>
                </div>

                {open && (
                  <div className="space-y-3 border-t border-border p-4">
                    <div className="space-y-3">
                      {messages.map((m) => (
                        <div
                          key={m.id}
                          className={`rounded-xl border px-3 py-2 text-sm ${
                            m.sender === "admin"
                              ? "border-primary/40 bg-primary/10 text-foreground"
                              : "border-border bg-secondary text-secondary-foreground"
                          }`}
                        >
                          <p
                            className={`mb-1 text-xs font-bold ${m.sender === "admin" ? "text-primary" : "text-foreground"}`}
                          >
                            {m.sender === "admin" ? "SmartyGym reply" : "Your message"}
                          </p>
                          <p className="whitespace-pre-wrap">{m.body}</p>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {when(m.created_at)}
                          </p>
                        </div>
                      ))}
                    </div>
                    <Textarea
                      rows={3}
                      placeholder="Write a reply…"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      maxLength={5000}
                      className="resize-none"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => sendReply(t.id)}
                        disabled={busy || !draft.trim()}
                        className="rounded-2xl"
                      >
                        {busy ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="mr-2 h-4 w-4" />
                        )}
                        Send reply
                      </Button>
                      <Button
                        variant="secondary"
                        className="rounded-2xl"
                        onClick={() => bulkRead(t.user_unread, [t.id])}
                      >
                        Mark as {t.user_unread ? "read" : "unread"}
                      </Button>
                      <Button
                        variant="ghost"
                        className="rounded-2xl text-destructive"
                        onClick={() => setConfirm([t.id])}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <AppConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Delete conversations?"
        description={confirm?.length === 1
          ? "This conversation will be permanently deleted."
          : `${confirm?.length ?? 0} conversations will be permanently deleted.`}
        confirmLabel="Delete"
        cancelLabel="Keep conversations"
        tone="danger"
        onConfirm={doDelete}
      />
    </div>
  );
}
