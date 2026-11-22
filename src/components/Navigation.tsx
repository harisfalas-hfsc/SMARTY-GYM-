import { iconTone } from "@/lib/icon-tone";
import { useFreeAccessMode } from "@/hooks/useFreeAccessMode";
import { Link, useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import {
  LogOut,
  Menu,
  X,
  Home,
  Wrench,
  Crown,
  Gift,
  Info,
  Mail,
  HelpCircle,
  Shield,
  FileText,
  AlertTriangle,
  ClipboardList,
  Sparkles,
  BookOpen,
  ChevronLeft,
  User,
  Dumbbell,
  CalendarCheck,
  Users,
  LogIn, ClipboardCheck, Moon, Sun, Bell, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/lib/theme";
import { signOutAndClearDevice } from "@/lib/sign-out";
import { adminCheckAccess } from "@/lib/admin.functions";
import { useInboxUnread } from "@/components/NotificationBell";
import { SmartyCoachDialog } from "@/components/SmartyCoachDialog";
import { CheckinHeaderAlert } from "@/components/checkins/CheckinHeaderAlert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


export function Navigation() {
  const { user, displayName, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [navCount, setNavCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { unread: inboxUnread } = useInboxUnread();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const unsub = router.subscribe("onResolved", () => {
      setNavCount((n) => n + 1);
    });
    return unsub;
  }, [router]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  useEffect(() => {
    const open = () => { setCoachOpen(true); };
    const close = () => { setCoachOpen(false); };
    const openMenu = () => {
      setCoachOpen(false);
      setMenuOpen(true);
    };
    window.addEventListener("smarty:open-coach", open);
    window.addEventListener("smarty:close-coach", close);
    window.addEventListener("smarty:open-menu", openMenu);
    return () => {
      window.removeEventListener("smarty:open-coach", open);
      window.removeEventListener("smarty:close-coach", close);
      window.removeEventListener("smarty:open-menu", openMenu);
    };
  }, []);

  const canGoBack = pathname !== "/";

  const handleBack = () => {
    if (navCount > 0) {
      router.history.back();
      return;
    }
    void navigate({ to: "/" });
  };

  async function handleSignOut() {
    await signOutAndClearDevice(user?.id, user?.email);
    navigate({ to: "/", replace: true });
  }

  const accountName = displayName || user?.email || "Account";
  const initial = accountName.slice(0, 1).toUpperCase();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    if (!user) {
      setIsAdmin(false);
      return;
    }
    void adminCheckAccess()
      .then((r) => {
        if (active) setIsAdmin(Boolean(r?.isAdmin));
      })
      .catch(() => {
        if (active) setIsAdmin(false);
      });
    return () => {
      active = false;
    };
  }, [user?.id]);

  return (
    <header
      className={`sticky top-0 z-40 w-full bg-background transition-colors duration-200 lg:py-3 ${scrolled ? "lg:bg-background" : "lg:bg-transparent"} ${pathname === "/" ? "lg:fixed lg:inset-x-0 lg:top-0" : "lg:top-0"}`}
    >
      <div className="flex h-11 items-center justify-between gap-2 px-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary text-primary hover:bg-primary/10 md:inline-flex md:border-transparent"
          >
            <Menu className="h-5 w-5" />
          </button>
          {canGoBack && (
            <button
              type="button"
              onClick={handleBack}
              aria-label="Go back"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary text-primary hover:bg-primary/10"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={async () => {
              // Acts as the app's refresh button: go home, reload data, scroll to top.
              await router.navigate({ to: "/" });
              void router.invalidate();
              window.scrollTo({ top: 0, behavior: "auto" });
            }}
            aria-label="SmartyGym home and refresh"
            className="bg-transparent p-0 text-[1.40625rem] md:text-lg font-extrabold leading-none tracking-tight no-underline hover:no-underline"
            style={{ textDecoration: "none" }}
          >
            <span data-brand-skip data-brand-logo><span className="text-primary">SMARTY</span><span className="text-green-500">GYM</span></span>
          </button>


        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!loading && user ? <CheckinHeaderAlert /> : null}
          {loading ? null : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={inboxUnread ? `Account (${inboxUnread} unread notifications)` : "Account"}
                  className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-primary bg-primary text-xs font-bold text-primary-foreground lg:bg-transparent lg:text-primary"
                >
                  {initial}
                  {inboxUnread > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground lg:hidden">
                      {inboxUnread > 9 ? "9+" : inboxUnread}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="space-y-0.5">
                  <span className="block truncate">{accountName}</span>
                  {user.email && accountName !== user.email && (
                    <span className="block truncate text-xs font-normal text-muted-foreground">{user.email}</span>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link to="/account"><User className="h-4 w-4 mr-2" /> My account</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    to="/inbox"
                    search={{ tab: "updates" as const, compose: false }}
                  >
                    <Bell className="h-4 w-4 mr-2" /> Inbox
                    {inboxUnread > 0 && (
                      <span className="ml-auto grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground">
                        {inboxUnread > 9 ? "9+" : inboxUnread}
                      </span>
                    )}
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                        <DropdownMenuItem asChild>
                      <Link to="/admin">
                        <Shield className="h-4 w-4 mr-2" /> Admin
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuItem onClick={toggleTheme}>
                  {theme === "dark" ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                  {theme === "dark" ? "Light mode" : "Dark mode"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Account"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-primary text-primary hover:bg-primary/10"
                >
                  <User className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link to="/auth"><LogIn className="h-4 w-4 mr-2" /> Sign in</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleTheme}>
                  {theme === "dark" ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                  {theme === "dark" ? "Light mode" : "Dark mode"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {menuOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <NavDrawer onClose={() => setMenuOpen(false)} isAuthed={!!user} isAdmin={isAdmin} />,
          document.body,
        )}
      <SmartyCoachDialog key={user?.id ?? "visitor"} accountKey={user?.id ?? null} open={coachOpen} onOpenChange={setCoachOpen} visitor={!user} />
    </header>
  );
}

function NavDrawer({ onClose, isAuthed, isAdmin }: { onClose: () => void; isAuthed: boolean; isAdmin: boolean }) {
  const { freeAccessMode } = useFreeAccessMode();
  const sections: {
    heading: string;
    items: { to: string; label: string; Icon: typeof Home; className?: string; coach?: boolean }[];
  }[] = [
    ...(isAuthed
      ? [
          {
            heading: "App",
            items: [
              { to: "/wod", label: "Workout of the Day", Icon: CalendarCheck },
              { to: "/smarty-workouts", label: "Smarty Workouts", Icon: Dumbbell },
              { to: "/create-your-own-workout", label: "Create Your Own Workout", Icon: Sparkles },
              { to: "/shared-workouts", label: "Shared Workouts", Icon: Dumbbell },
              { to: "/smarty-ritual", label: "Smarty Ritual", Icon: Sparkles },
              { to: "/smarty-checkins", label: "Smarty Check-ins", Icon: ClipboardCheck },
              { to: "/logbook", label: "Logbook", Icon: BookOpen },
              { to: "/community", label: "Smarty Community", Icon: Users },
              { to: "/inbox", label: "Inbox & messages", Icon: Mail },
              { to: "/account", label: "My account", Icon: User },

              ...(isAdmin ? [{ to: "/admin", label: "Admin", Icon: Shield }] : []),
            ],
          },
        ]
      : []),
    {
      heading: "SmartyGym",
      items: [
        { to: "/", label: "Home", Icon: Home },
        { to: "/about", label: "About", Icon: Info, className: "lg:hidden" },
        { to: "/how-it-works", label: "How It Works", Icon: BookOpen },
        ...(isAuthed ? [] : [{ to: "/wod", label: "Workout of the Day", Icon: CalendarCheck }]),
        ...(isAuthed ? [] : [{ to: "/smarty-workouts", label: "Smarty Workouts", Icon: Dumbbell }]),
        ...(isAuthed ? [] : [{ to: "/create-your-own-workout", label: "Create Your Own Workout", Icon: Sparkles }]),
        ...(isAuthed ? [] : [{ to: "/shared-workouts", label: "Shared Workouts", Icon: Dumbbell }]),
        ...(isAuthed ? [] : [{ to: "/smarty-ritual", label: "Smarty Ritual", Icon: Sparkles }]),
        ...(isAuthed ? [] : [{ to: "/smarty-checkins", label: "Smarty Check-ins", Icon: ClipboardCheck }]),
        ...(isAuthed ? [] : [{ to: "/community", label: "Smarty Community", Icon: Users }]),
        { to: "/exercise-library", label: "Exercise Library", Icon: Dumbbell },
        { to: "/tools", label: "Smarty Tools", Icon: Wrench },
        { to: "/blog", label: "Smarty Blog", Icon: BookOpen },
        { to: "/smarty-gift", label: "Smarty Gift", Icon: Gift },
        ...(freeAccessMode ? [] : [{ to: "/pricing", label: "Pricing", Icon: Crown }]),
        { to: "/faq", label: "Frequently Asked Questions", Icon: HelpCircle },
        { to: "/contact", label: "Contact", Icon: Mail },

      ],
    },
    {
      heading: "Legal",
      items: [
        { to: "/privacy", label: "Privacy Policy", Icon: Shield },
        { to: "/terms", label: "Terms of Service", Icon: FileText },
        { to: "/disclaimer", label: "Disclaimer", Icon: AlertTriangle },
      ],
    },
    {
      heading: "Discover",
      items: [
        { to: "#smarty-coach", label: "Smarty Coach", Icon: MessageCircle, coach: true },
        { to: "/haris-falas", label: "Meet the Coach", Icon: User },
        { to: "/glossary", label: "Glossary & training topics", Icon: BookOpen },
        { to: "/social-media", label: "Social Media", Icon: Users, className: "md:hidden" },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <aside
        className="absolute left-0 top-0 flex h-full w-[85%] max-w-[340px] flex-col bg-background shadow-2xl"
      >
        <div className="flex h-12 items-center justify-between px-4">
          <div className="text-base font-extrabold" data-brand-skip data-brand-logo>
            <span className="text-primary">SMARTY</span><span className="text-green-500">GYM</span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close menu"
            className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav
          className="flex-1 overflow-y-auto px-3"
          style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}
        >
          {sections.map((s) => (
            <div key={s.heading} className="mt-2">
              <div className="px-2 pb-1.5 pt-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {s.heading}
              </div>
              <ul className="space-y-1">
                {s.items.map(({ to, label, Icon, className, coach }) => (
                  <li key={to} className={className}>
                    <Link
                      to={coach ? "." : to}
                      onClick={(e) => {
                        onClose();
                        if (coach) {
                          e.preventDefault();
                          window.dispatchEvent(new Event("smarty:open-coach"));
                        }
                      }}
                      className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-primary/10"
                      style={{ textDecoration: "none" }}
                    >
                      <span className={`grid h-9 w-9 place-items-center rounded-xl ${iconTone(label)}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </div>
  );
}
