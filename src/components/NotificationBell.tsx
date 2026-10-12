import { useEffect, useState } from "react";
import { isOnline } from "@/lib/connectivity";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { listNotifications } from "@/lib/daily.functions";
import { listMyThreads } from "@/lib/support.functions";
import { useAuth } from "@/hooks/useAuth";
import { loadRemote } from "@/lib/remote-data";
import { INBOX_CHANGED_EVENT, type InboxSnapshot } from "@/lib/inbox-sync";

type Notification = Awaited<ReturnType<typeof listNotifications>>["notifications"][number];
type Thread = Awaited<ReturnType<typeof listMyThreads>>["threads"][number];

type Item = {
  id: string;
  kind: "update" | "message";
  title: string;
  body: string | null;
  unread: boolean;
  at: string;
};

export function NotificationBell() {
  const load = useServerFn(listNotifications);
  const loadThreads = useServerFn(listMyThreads);
  const { user } = useAuth();
  const [, setItems] = useState<Item[]>([]);
  const [updatesUnread, setUpdatesUnread] = useState(0);
  const [messagesUnread, setMessagesUnread] = useState(0);
  const unread = updatesUnread + messagesUnread;

  useEffect(() => {
    let active = true;
    const fetchAll = () => {
      void Promise.all([
        loadRemote("inbox:notifications", () => load({}), user?.id),
        loadRemote("inbox:threads", () => loadThreads({}), user?.id),
      ]).then(([notif, support]) => {
        if (!active) return;
        setUpdatesUnread(notif.unread);
        setMessagesUnread(support.threads.filter((t) => t.user_unread).length);
        const merged: Item[] = [
          ...notif.notifications.map((n) => ({
            id: n.id,
            kind: "update" as const,
            title: n.title,
            body: n.body,
            unread: !n.read_at,
            at: n.created_at,
          })),
          ...support.threads.map((t) => ({
            id: t.id,
            kind: "message" as const,
            title: t.subject,
            body: t.messages?.[t.messages.length - 1]?.body ?? null,
            unread: t.user_unread,
            at: t.last_message_at,
          })),
        ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
        setItems(merged);
      }).catch(() => undefined);
    };
    const onChanged = (event: Event) => {
      const detail = (event as CustomEvent<Partial<InboxSnapshot>>).detail;
      if (typeof detail?.updatesUnread === "number") setUpdatesUnread(detail.updatesUnread);
      if (typeof detail?.messagesUnread === "number") setMessagesUnread(detail.messagesUnread);
      if (detail?.removedUpdateIds?.length)
        setItems((prev) => prev.filter((item) => item.kind !== "update" || !detail.removedUpdateIds?.includes(item.id)));
      if (detail?.removedMessageIds?.length)
        setItems((prev) => prev.filter((item) => item.kind !== "message" || !detail.removedMessageIds?.includes(item.id)));
      if (detail?.readUpdateIds?.length)
        setItems((prev) => prev.map((item) => item.kind === "update" && detail.readUpdateIds?.includes(item.id) ? { ...item, unread: false } : item));
      if (detail?.unreadUpdateIds?.length)
        setItems((prev) => prev.map((item) => item.kind === "update" && detail.unreadUpdateIds?.includes(item.id) ? { ...item, unread: true } : item));
      if (detail?.readMessageIds?.length)
        setItems((prev) => prev.map((item) => item.kind === "message" && detail.readMessageIds?.includes(item.id) ? { ...item, unread: false } : item));
      if (detail?.unreadMessageIds?.length)
        setItems((prev) => prev.map((item) => item.kind === "message" && detail.unreadMessageIds?.includes(item.id) ? { ...item, unread: true } : item));
      if (isOnline() && (!detail || Object.keys(detail).length === 0)) fetchAll();
    };
    fetchAll();
    window.addEventListener(INBOX_CHANGED_EVENT, onChanged);
    window.addEventListener("online", fetchAll);
    window.addEventListener("focus", fetchAll);
    const t = setInterval(fetchAll, 30_000);
    return () => {
      active = false;
      window.removeEventListener(INBOX_CHANGED_EVENT, onChanged);
      window.removeEventListener("online", fetchAll);
      window.removeEventListener("focus", fetchAll);
      clearInterval(t);
    };
  }, [load, loadThreads, user?.id]);

  return (
    <Link
      to="/inbox"
      search={{ tab: messagesUnread > 0 && updatesUnread === 0 ? ("messages" as const) : ("updates" as const), compose: false }}
      aria-label={unread ? `Inbox (${unread} unread)` : "Inbox"}
      className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary text-primary hover:bg-primary/10"
    >
      <Bell className="h-4 w-4" />
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
